import { config } from "./config.mjs"

/*
 * This is a Morio handler to process audit data collected by the Morio client.
 * It can create events to highlight relevant events, and cache audit data.
 */
const handler = config.enabled ? {
  ...config,
  method: (data, tools, topic) => {
    /*
     * FIXME: Write this handler
     */
  }
} : false

export default handler
