import { config } from "./config.mjs"
import modules from "./modules/index.mjs"

/*
 * This is a Morio handler to cache recent log lines
 *
 * It will set two cache keys:
 *
 *   - log|[data.host.id]|[data.morio.module.name]|[data.log.file.path]
 *     => Will hold the recent log lines
 *   - log|[host.id]
 *     => Will hold a hash with
 *        - module names as fields
 *        - a list of log files as value
 */
const handler = config.enabled ? {
  ...config,
  method: (data, tools, topic) => {
    /*
     * Only handle data that has a log message
     */
    if (data?.message) {
      /*
       * Figure out what cache key to use
       */
      let logset = false
      // Regular logs read from a file
      if (data?.log?.file?.path) logset = data.log.file.path
      // Logs from journald
      if (data?.input?.type === 'journald') {
        const t = 'journald'
        if (data?.container?.name) logset = `${t}.container.${data.container.name}`
        else if (data?.journald?.process?.name) logset = `${t}.process.${data.journald.process.name}`
        else if (data?.syslog?.identifier) logset = `${t}.syslog.${data?.syslog?.identifier}`
        else logset = `${t}.generic`
      }

      /*
       * Only cache what we understand
       */
      if (!logset) return tools.note(`Failed to extract logset from data: ${JSON.stringify(data)}`)

      /*
       * Update the cache
       */
      tools.cache.logline(logset, data.message, data, config)
    }

    /*
     * Hand over to module-specific logic
     */
    if (data?.morio?.module && typeof modules[data.morio.module] === 'function') {
      let logset = false
      let logline = false
      try {
        [logset, logline] = modules[data.morio.module](data, tools)
        if (config.cache) {
          // If the module returned logset and logline, cache
          if (logset && logline) tools.cache.logline(logset, logline, data, config)
          // If not, attempt default cache
          else {
            [logset, logline] = defaultLogCaching(data, tools)
            if (logset && logline) tools.cache.logline(logset, logline, data, config)
            else if (config.log_unhandled) {
              tools.note(`[logs] Cannot handle message (module)`, data)
            }
          }
        }
      }
      catch(err) {
        tools.note(`[event] Error in module handler`, { err, data })
      }
    }
    else {
      const [logset, logline] = defaultLogCaching(data, tools)
      if (logset && logline) tools.cache.logline(logset, logline, data, config)
      else if (config.log_unhandled) {
        tools.note(`[logs] Cannot handle message (default)`, data)
      }
    }
  }
} : null


function defaultLogCaching (data, tools) {
  return [
    data?.log?.file?.path || false,
    data?.mesage || false
  ]
}

export default handler

export const info = {
  title: 'Log stream processor',
  about: `This stream processor will process log data flowing through your Morio collection.

It can cache recent log data, as well as eventify them for event-driven automation.
It also supports dynamic loading of module-specific logic.`,
  settings: {
    enabled: {
      title: 'Enable logs stream processor',
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
      dflt: ['logs'],
      title: 'List of topics to subscribe to',
      about: `Changing this from the default \`logs\` is risky`,
      type: 'labels',
    },
    cache: {
      dflt: true,
      title: 'Cache log data',
      type: 'list',
      list: [
        {
          val: false,
          label: 'Do not cache log data (disable)',
        },
        {
          val: true,
          label: 'Cache recent log data',
          about: 'Caching log data allows consulting it through the dashboards provided by Morio&apos;s UI service'
        },
      ],
    },
    ttl: {
      dflt: 4,
      title: 'Maxumum age of cached logs',
      about: 'Logs in the cache will expire after this amount of time',
      labelBL: 'In hours',
      type: 'number'
    },
    cap: {
      dflt: 25,
      title: 'Maximum number of log lines per logset',
      about: 'This is a hard safety limit regardless of cache age.',
      labelBL: 'In log lines',
      type: 'number'
    },
    eventify: {
      dflt: true,
      title: 'Eventify log data',
      type: 'list',
      list: [
        {
          val: false,
          label: 'Do not eventify log data (disable)',
        },
        {
          val: true,
          label: 'Auto-create events based on log data',
          about: 'Eventifying log data allows for event-driven automation and monitoring based on your logs',
        },
      ],
    },
  }
}
