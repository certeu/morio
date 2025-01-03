import { config } from "./config.mjs"
import modules from "./modules/index.mjs"

/*
 * This is a Morio handler to process audit data collected by the Morio client.
 *
 * It handles the high-level logic, but relies on module-specific code to
 * determine what to do for a given audit message.
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
     * Do not handle hosts that lack an ID
     */
    if (!data.host.id) tools.note(`Host lacks ID: : ${JSON.stringify(data)}`)

    /*
     * Only handle hosts when we know how to
     * transform data from the Morio module that generated it
     */
    if (!data?.morio?.module || typeof modules[data.morio.module] !== 'function') {
      tools.note(`Cannot handle audit event ${data.event?.action}`, data)
      return
    }

    /*
     * Hand of to module-specific code to determine what to do
     */
    const result = modules[data.morio.module](data, tools)

    /*
     * Only update if we get data back from the module code
     */
    if (result) tools.cache.audit(result)
  }
} : false

export default handler

