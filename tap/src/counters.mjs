import { processorList, topics } from '../loader.mjs'
import { tools } from './tools.mjs'
import { node } from '../config/tap.mjs' // Needs to be mounted in the container

/*
 * Take a measurement over 30s (value in ms)
 */
const tick = 30000

/*
 * We keep track of throughput in-memory
 */
const counters = {
  topics: {},
  procs: {},
  peak: {
    topics: {},
    procs: {},
  },
}

export const count = {
  message: function (topic) {
    counters.topics[topic]++
    if (counters.topics[topic] > counters.peak.topics[topic]) {
      counters.peak.topics[topic] = counters.topics[topic]
    }
  },
  processor: function (name) {
    counters.procs[name]++
    if (counters.procs[name] > counters.peak.procs[name]) {
      counters.peak.procs[name] = counters.procs[name]
    }
  },
}

/*
 * This function is called to start the count
 */
function startCount() {
  /*
   * Start with a clean slate
   */
  resetCounters(processorList, topics)

  /*
   * Then collect data every tick (30s)
   */
  tools.counter = setInterval(() => {
    /*
     * We avoid the async gap that would occur if we were to call
     * the producer with the current value in counters, and then
     * reset them as soon as the request is confirmed.
     * Instead, we roll over the counter here in sync
     */
    const data = resetCounters()
    return tools.producer
      .send({
        topic: 'metrics',
        messages: [{ value: JSON.stringify(countersAsEcs(data)) }],
      })
      .catch((err) => tools.cache.note('Error when producing counters', err))
  }, tick)
}

function countersAsEcs(throughput) {
  return {
    '@timestamp': new Date().toISOString(),
    '@metadata': {
      type: '_doc',
      _id: tools.create.id(),
    },
    ecs: { version: '8.0.0' },
    event: {
      dataset: 'linux-morio-tap.throughput',
    },
    metricset: {
      name: 'throughput',
      period: tick,
    },
    morio: {
      tap: {
        throughput,
        version: 7,
      },
    },
    host: {
      id: node.uuid,
      name: node.fqdn,
    },
    labels: {
      'morio.module': 'linux-morio-tap',
    },
  }
}

/**
 * Reset counters on every tick
 *
 * @param {bool} init - Whether or not this is in initial reset
 */
function resetCounters(init = false) {
  if (init) {
    /*
     * Initial start, just initialise the counters object
     */
    for (const topic of topics) {
      counters.topics[topic] = 0
      counters.peak.topics[topic] = 0
    }
    for (const proc of processorList) {
      counters.procs[proc] = 0
      counters.peak.procs[proc] = 0
    }

    return
  } else {
    /*
     * Counter snapshot. We will extract the currect counters data
     */
    const data = {
      topics: {},
      procs: {},
      peak: counters.peak,
    }
    for (const topic of topics) {
      data.topics[topic] = counters.topics[topic]
      counters.topics[topic] = 0
    }
    for (const proc of processorList) {
      data.procs[proc] = counters.procs[proc]
      counters.procs[proc] = 0
    }

    return data
  }
}

/*
 * Start counting as soon as we load
 */
startCount()
