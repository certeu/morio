import { config } from "./config.mjs"
import modules from "./modules/index.mjs"

/*
 * This is a Morio handler to process event data.
 *
 * It handles the high-level logic and caching.
 * It relies on module-specific code to determine what to do for a given event message.
 */
const handler = config.enabled ? {
  ...config,
  /**
   * This is the morio handler method for audit data
   *
   * @param {object} data - The data from RedPanda
   * @param {obectt} tools - The tools object
   */
  method: (data, tools, topic) => {
    /*
     * Cache events if configured to do so
     */
    if (config.cache) tools.cache.event(data)

    /*
     * Create note when host ID is missing
     */
    if (!data.host.id) tools.note(`[event] Host lacks ID: : ${JSON.stringify(data)}`)

    /*
     * Hand over to module-specific logic
     */
    if (data?.morio?.module && typeof modules[data.morio.module] === 'function') {
      try {
        modules[data.morio.module](data, tools)
      }
      catch(err) {
        tools.note(`[event] Error in module handler`, { err, data })
      }
    }
    else if (config.log_unhandled) {
      tools.note(`[event] Cannot handle message`, data)
    }
  }
} : false

export default handler

export const info = {
  title: 'Event data stream processor',
  about: `This stream processor will process event data flowing through your Morio collection.

It can cache recent events, and supports dynamic loading of module-specific logic.`,
  settings: {
    enabled: {
      title: 'Enable events stream processor',
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
      dflt: ['events'],
      title: 'List of topics to subscribe to',
      about: `Changing this from the default \`events\` is risky`,
      type: 'labels',
    },
    cache: {
      dflt: true,
      title: 'Cache event data',
      type: 'list',
      list: [
        {
          val: false,
          label: 'Do not cache event data (disable)',
        },
        {
          val: true,
          label: 'Cache recent event data',
          about: 'Caching event data allows consulting it through the dashboards provided by Morio&apos;s UI service'
        },
      ],
    },
    cap: {
      dflt: 250,
      title: 'Maximum number of events to cache',
      about: 'This is a hard limit.',
      labelBL: 'In cached events',
      type: 'number'
    },
  }
}

