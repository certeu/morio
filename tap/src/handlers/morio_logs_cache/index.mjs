import { config } from "./config.mjs"

/*
 * This is a Morio handler to cache logs
 */
const handler = config.enabled ? {
  ...config.handler,
  method: ({ data }, tools) => {
    return false
    /*
     * Only handle data that is in the correct format
     */
    if (!data?.monitor?.id || !data?.monitor?.name) return tools.log.debug(data, 'Invalid healthcheck data')

    /*
     * Figure out what's going on.
     *   up: Whether the healthcheck is up (ok) or not (0 or 1)
     *   ms: Time in milliseconds that it took (useful observability signal)
     *   dbce: Days before certificate expires (only for https checks)
     */
    const [up, ms, dbce] = healthcheckSummary(data, tools)
    const time = tools.time.when(data)
    if (!up && ['alarm', 'notification'].includes(config.onDownProduce)) {
      // Prepare the nessage data
      const msg_data = {
        context: tools.create.context('healthcheck', data.monitor.type, data.monitor.id, tools.format.escape(data.url?.full)),
        host: data.host?.id,
        module: data.morio?.module?.name,
        tags: [ 'healthcheck', 'down', data.monitor.type, data.monitor.id ],
        time,
        title: `Healthcheck failed: ${data.url?.full}`,
        type: `${data.monitor.type}.healthcheck.down`,
      }
      if (config.onDownProduce === 'notification') tools.produce.notification(msg_data)
      else tools.produce.alarm(msg_data)
    }

    /*
     * Update the cache
     */
    if (config.cache) tools.cache.healthcheck(data, { time, up, ms, dbce })

    /*
     * Can't do a simple if (!dbce) here because dbce can be zero
     */
    if (dbce !== undefined) {
      // FIXME: Make this treshold configurable
      if (dbce < 5) tools.produce.alarm({
        context: tools.create.context(`tls.certificate.${tools.format.escape(data.url.full)}`),
        host: data?.url?.domain,
        module: data?.morio?.module?.name,
        title: `⏳ Certificate will expire in ${dbce} days: ${data?.url?.full}`,
        type: 'tls.certificate.expiry.imminent',
        tags: ['tls','certificate','expiry'],
      })
      // FIXME: Make this treshold configurable
      else if (dbce < 15) tools.produce.notification({
        context: tools.create.context(`tls.certificate.${tools.format.escape(data.url.full)}`),
        host: data?.url?.domain,
        module: data?.morio?.module?.name,
        tags: ['tls','certificate','expiry'],
        title: `⏳ Certificate will expire in ${dbce} days: ${data?.url?.full}`,
        type: 'tls.certificate.expiry.approaching',
      })
    }
  }
} : null

export default handler

