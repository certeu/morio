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
const counters = {}

export const count = {
  message: function (topic) {
    counters.topics[topic]++
  },
  processor: function (name) {
    counters.processors[name]++
  }
}

/*
 * This function is called to start the count
 */
function startCount () {
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
        messages: [{ value: JSON.stringify(countersAsEcs(data)) }]
      })
      .catch(err => tools.cache.note('Error when producing counters', err))
  }, tick)
}

function countersAsEcs (throughput) {
  return {
    "@timestamp": new Date().toISOString(),
    ecs: { version: "8.0.0" },
    event: {
      dataset: "morio-tap.throughput",
    },
    metricset: {
      name: "throughput",
      period: tick,
    },
    morio: {
      tap: {
        throughput,
        version: 7
      }
    },
    host: {
      id: node.uuid,
      name: node.fqdn,
    },
    labels: {
      'morio.module': 'morio-tap'
    }
  }
}

/**
 * Reset counters on every tick
 *
 * @param {object} processors - The stream processors that are loaded
 * @param {array} topics - The topics we are subscribed to
 */
function resetCounters(processors=false, topics=false) {
  /*
   * Only on initial startup will stream processors and topics be set
   */
  const init = (processors && topics) ? true : false

  /*
   * Stream processors and topics are only passed in at the initial startup
   * So at that time, we use them, later on we re-use the keys in counters
   */
  const list = {
    processors: init ? processors : Object.keys(counters.processors),
    topics: init ? topics : Object.keys(counters.topics)
  }

  if (init) {
    /*
     * Initial start, just initialise the counters object
     */
    for (const type of Object.keys(list)) {
      const reset = {}
      for (const name of list[type]) reset[name] = 0
      counters[type] = reset
    }

    return
  } else {
    /*
     * Counter snapshot. We will extract the currect counters data and convert to msg/s
     */
    const data = { topics: {}, processors: {} }
    for (const type of Object.keys(list)) {
      const reset = {}
      for (const name of list[type]) {
        reset[name] = 0
        /*
         * We use Math.ceil() here because it is the better choice when there is
         * not a lot of data. Essentially, we want to avoid that 0.5 msg/s does not
         * register as anything at all.
         * On the higher end of the spectrum, who cares whether it's 3000/s or 3001/s
         */
        data[type][name] = counters[type]?.[name] ? Math.ceil(counters[type][name]/30) : 0
      }
      counters[type] = reset
    }

    return data
  }
}

/*
 * Start counting as soon as we load
 */
startCount()
