import { config } from "./config.mjs"

/*
 * This is a Morio handler to process event data collected by the Morio client.
 * It can create events to highlight relevant events, and cache audit data.
 */
const handler = config.enabled ? {
  ...config,
  method: (data, tools, topic) => {
    /*
     * Cache events
     */
    if (config.cache) tools.cache.event(data)

  }
} : false

export default handler
