import http from 'node:http'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import get from 'lodash/get.js'
import set from 'lodash/set.js'

// Add async exec
const execAsync = promisify(exec)

// Keep track of message counts
const counters = {}
const increaseCounter = (path) => set(counters, path, get(counters, path, 0) + 1)

// Figure out how many instances/threads are running
const instance = {
  count: parseInt(process.env.instances || 1),
  id: parseInt(process.env.pm_id || 0),
}

/*
 * Starts a HTTP listener for the health and metrics endpoints
 *
 * @param {object} tools - The tools helper object
 * @return {object} server - The server object
 */
export function startMetrics(tools) {
  const metricsPort = (tools.config?.tap?.metricsPort || 9666) + instance.id
  const server = http.createServer((req, res) => handleMetricsRequest(req, res, tools))
  server.listen(metricsPort, () => {
    tools.log.info(`Metrics endpoint listening on http://localhost:${metricsPort}/metrics`)
  })

  // Attach metrics count handler to tools object
  tools.count = increaseCounter

  return server
}

/*
 * Handle HTTP requests for metrics - Typical NodeJS request handler
 *
 * @param {object} req - The NodeJS request object
 * @param {object} res - The NodeJS response object
 * @param {object} tools - The tools helper object
 */
async function handleMetricsRequest(req, res, tools) {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // Metrics endpoint
  if (url.pathname === '/metrics') {
    const metrics = await getLocalMetrics(tools)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(metrics))
  }
  // Health endpoint
  else if (url.pathname === '/health') {
    const lhb = Date.now() - tools.status.consumer.heartbeat
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'healthy',
        consumer: {
          ...tools.status.consumer,
          last_heartbeat: lhb ? lhb : -1,
        },
        producer: tools.status.producer,
      })
    )
  }
  // Consolidated metrics endpoint (consolidated for all instances/threads)
  else if (url.pathname === '/metrics/all') {
    const metrics = await getAllMetrics(tools)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(metrics))
  }
  // 404 for everything else
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

/*
 * Gets the local metrics (this thread)
 *
 * @param {object} tools - The tools helper object
 * @return {object} metrics - The local metrics
 */
async function getLocalMetrics(tools) {
  const pm2 = await getPM2Stats(tools)

  return { counters, pm2, instance }
}

/*
 * Grabs the output of `pm2 jlist` and parse it
 * This gives us metrics of the process.
 *
 * @param {object} tools - The tools helper object
 * @return {object} metrics - The pm2 metrics
 */
async function getPM2Stats(tools) {
  try {
    const { stdout } = await execAsync('pm2 jlist')
    const processes = JSON.parse(stdout)

    // Find our instance/thread
    const proc = processes.find((p) => p.pm2_env.pm_id === instance.id)

    if (!proc) return null

    return {
      status: proc.pm2_env.status,
      restarts: proc.pm2_env.restart_time,
      uptime: Date.now() - proc.pm2_env.pm_uptime,
      memory: proc.monit.memory,
      cpu: proc.monit.cpu,
      pid: proc.pid,
      version: proc.pm2_env.version,
      unstableRestarts: proc.pm2_env.unstable_restarts || 0,
      // Extract PM2's built-in metrics
      heapUsed: parseFloat(proc.pm2_env.axm_monitor['Used Heap Size']?.value || 0),
      heapTotal: parseFloat(proc.pm2_env.axm_monitor['Heap Size']?.value || 0),
      heapUsage: proc.pm2_env.axm_monitor['Heap Usage']?.value || 0,
      eventLoopLatency: parseFloat(proc.pm2_env.axm_monitor['Event Loop Latency']?.value || 0),
      eventLoopLatencyP95: parseFloat(
        proc.pm2_env.axm_monitor['Event Loop Latency p95']?.value || 0
      ),
      activeHandles: proc.pm2_env.axm_monitor['Active handles']?.value || 0,
      activeRequests: proc.pm2_env.axm_monitor['Active requests']?.value || 0,
      httpReqPerMin: proc.pm2_env.axm_monitor['HTTP']?.value || 0,
      httpLatencyP95: proc.pm2_env.axm_monitor['HTTP P95 Latency']?.value || 0,
      httpLatencyMean: proc.pm2_env.axm_monitor['HTTP Mean Latency']?.value || 0,
    }
  } catch (err) {
    tools.log.debug(err, 'Failed to load PM2 stats')
    return null
  }
}

/*
 * It's easier to allow people to fetch metrics for all
 * threads/instances from a single endpoint, rather than
 * having to combine them themselves.
 * So this function connects to the metrics listener for
 * threads that are not this one.
 *
 * @param {number} instanceId - The id of the instance to target
 * @param {object} tools - The tools helper object
 * @return {object} metrics - The metrics of that instance
 */
async function getRemoteMetrics(instanceId, tools) {
  let result
  try {
    result = await tools.axios.get(
      `http://localhost:${(tools.config?.tap?.metricsPort || 9666) + instanceId}/metrics`,
      { timeout: 3000 }
    )
    if (result.data?.pm2) return result.data
  }
  catch (err) {
    tools.log.warn(err, `Failed to load metrics from tap instance ${instanceId}`)
  }

  return false
}

/*
 * Aggregate metrics from all instances
 *
 * @param {number} instanceId - The id of the instance to target
 * @param {object} tools - The tools helper object
 * @return {object} metrics - The metrics of that instance
 */
async function getAllMetrics(tools) {
  const metrics = { instance, instances: {} }
  for (let i = 0; i < instance.count; i++) metrics.instances[i] = (i === instance.id)
    ? await getLocalMetrics(tools)
    : await getRemoteMetrics(i, tools)

  return metrics
}

/*
 * Heartbeat happens every 3 seconds. We use this to check lag
 * although doing so every 3 seconds would be a bit much, so
 * instead we do it ever 30s.
 *
 * Using this lifecycle event prevents us from having to run
 * an interval for this.
 */
export async function consumerHeartbeatHandler(tools) {
  const now = Date.now()
  tools.status.consumer.heartbeat = now
  if (now - (counters.lag?.lastUpdate || 0) < 30000) return false

  // Load topics from counters
  const topics = Object.keys(counters.topics || {})

  try {
    const admin = tools.kafkaClient.admin()
    await admin.connect()

    const groupId = tools.config.kafka.clientId
    let totalLag = 0
    const lagByTopic = {}

    for (const topic of topics) {
      try {
        // Get consumer's current offsets
        const consumerOffsets = await admin.fetchOffsets({
          groupId,
          topics: [topic],
        })

        // Get latest offsets for the topic
        const topicOffsets = await admin.fetchTopicOffsets(topic)

        // Calculate lag per partition
        let topicLag = 0
        for (const partition of consumerOffsets[0]?.partitions || []) {
          const partitionId = partition.partition
          const consumerOffset = BigInt(partition.offset)

          const latestOffset = topicOffsets.find((p) => p.partition === partitionId)
          if (latestOffset) {
            const lag = Number(BigInt(latestOffset.high) - consumerOffset)
            topicLag += lag
          }
        }

        lagByTopic[topic] = topicLag
        totalLag += topicLag
      } catch (err) {
        tools.log.debug(`Could not fetch lag for topic ${topic}: ${err.message}`)
        lagByTopic[topic] = -1 // Indicate error
      }
    }

    await admin.disconnect()

    counters.lag = {
      total: totalLag,
      topics: lagByTopic,
      lastUpdate: now
    }
  } catch (err) {
    tools.log.warn(err, 'Error fetching consumer lag')
    return null
  }
}
