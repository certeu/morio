import http from 'node:http'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import get from 'lodash/get.js'
import set from 'lodash/set.js'

// Async exec
const execAsync = promisify(exec)

// Keep track of message counts
const counters = {}
const increaseCounter = (path) => set(counters, path, get(counters, path, 0) + 1)

export function startMetrics(tools) {
  /*
   * Start HTTP server for metrics
   */
  const metricsPort = tools.config?.tap?.metricsPort || 9666
  const server = http.createServer((req, res) => handleMetricsRequest(req, res, tools))
  server.listen(metricsPort, () => {
    tools.log.info(`Metrics endpoint listening on http://localhost:${metricsPort}/metrics`)
  })

  // Attach metrics count handler to tools object
  tools.count = increaseCounter

  return server
}

/*
 * Handle HTTP requests for metrics
 */
async function handleMetricsRequest(req, res, tools) {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (url.pathname === '/metrics') {
    // Collect metrics
    const metrics = await loadMetrics(tools)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(metrics))
  } else if (url.pathname === '/health') {
    const lhb = Date.now() - tools.status.consumer.heartbeat
    // Simple health check
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
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

/*
 * Format metrics in Prometheus exposition format
 */
async function loadMetrics(tools) {
  const pm2 = await getPM2Stats(tools)

  return { counters, pm2 }
}

/*
 * Grab the output of `pm2 jlist` and parse it
 */
async function getPM2Stats(tools) {
  try {
    const { stdout } = await execAsync('pm2 jlist')
    const processes = JSON.parse(stdout)

    // Find our process
    const processName = tools.config.tap?.processName || 'tap'
    const proc = processes.find((p) => p.name === processName)

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

export async function consumerHeartbeatHandler(tools) {
  // Heartbeat happens ever 3s, but we check lag every 30s
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
