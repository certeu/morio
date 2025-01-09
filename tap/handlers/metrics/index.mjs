import { config } from "./config.mjs"
import modules from "./modules/index.mjs"

/*
 * This is a Morio handler to handle the metrics
 */
const handler = config.enabled ? {
  ...config,
  method: (data, tools, topic) => {
    /*
     * Hand over to module-specific logic
     */
    if (data?.morio?.module && typeof modules[data.morio.module] === 'function') {
      let result
      try {
        result = modules[data.morio.module](data, tools)
        if (result) tools.cache.metricset(result, data, config)
      }
      catch(err) {
        tools.note(`[metrics] Error in module handler`, { err, data })
      }
    }
    else if (config.log_unhandled) {
      tools.note(`[metrics] Cannot handle message`, data)
    }

    /*
     * Metricset: throughput
     */
    //if (data.metricset?.name === 'throughput') tools.cache.metricset(data.morio.tap.throughput, data, config)
  }
} : null

export default handler

export const info = {
  docs: 'https://morio.it/docs/FIXME',
  title: 'Metrics stream processor',
  about: `This stream processor will process metrics data flowing through your Morio collector.

It can cache recent metrics, as well as enventify them for event-driven automation.
It also supports dynamic loading of module-specific logic.`,
  settings: {
    enabled: {
      title: 'Enable metrics stream processor',
      dflt: true,
      type: 'list',
      list: [
        {
          val: false,
          label: 'Disabled',
          about: 'Select this to completely disabled this stream processor',
        },
        {
          val: true,
          label: 'Enabled',
          about: 'Select this to enable this stream processor',
        },
      ]
    },
    topics: {
      dflt: ['metrics'],
      title: 'List of topics to subscribe to',
      about: `Changing this from the default \`metrics\` is risky`,
      type: 'labels',
    },
    cache: {
      dflt: true,
      title: 'Cache metrics data',
      type: 'list',
      list: [
        {
          val: false,
          label: 'Do not cache metrics (disable)',
        },
        {
          val: true,
          label: 'Cache recent metrics',
          about: 'Caching metrics allows consulting them through the dashboards provided by Morio&apos;s UI service'
        },
      ],
    },
    ttl: {
      dflt: 1,
      title: 'Maxumum age of cached metrics',
      about: 'Metrics in the cache will expire after this amount of time',
      labelBL: 'In hours',
      type: 'number'
    },
    cap: {
      dflt: 300,
      title: 'Maximum number of sets per metricset',
      about: 'This is a hard safety limit regardless of cache age or polling interval.',
      type: 'number'
    },
    eventify: {
      dflt: true,
      title: 'Eventify metrics',
      type: 'list',
      list: [
        {
          val: false,
          label: 'Do not eventify metrics (disable)',
        },
        {
          val: true,
          label: 'Auto-create events based on metrics',
          about: 'Eventifying metrics allows for event-driven automation and monitoring based on audit information',
        },
      ],
    },
  }
}
