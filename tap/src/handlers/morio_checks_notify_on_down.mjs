/*
 * This is a Morio handler to create a notification when something is down
 */

/*
 * Various healthcheck values that all mean things are ok, or 'up'
 */
const upValues = [ "1", "up", "green" ]

/*
 * This is a Morio handler to create a notification when something is down
 */
const handler = {
  topic: 'checks',
  filter: ({ data={} }) => data.summary?.status === "down",
  method: ({ data }, tools) => {
    /*
     * Only handle data that is in the correct format
     */
    if (!data?.monitor?.id || !data?.monitor?.name) return tools.log.debug(data, 'Invalid healthcheck data')

    /*
     * Figure out what's going on.
     *   up: Whether the healthcheck is up (ok) or not (0 or 1)
     *   took: Time in milliseconds that it took (useful observability signal)
     *   days: Days before certificate expiry (only for https checks)
     */
    const [up, took, days] = healthcheckSummary(data, tools)
    if (!up) tools.notify({
      context: tools.context('healthcheck', data.monitor.type, data.monitor.id, tools.escape(data.url?.full)),
      host: data.host?.id,
      module: data.morio?.module?.name,
      tags: [ 'healthcheck', 'down', data.monitor.type, data.monitor.id ],
      time: data['@timestamp'],
      title: `Healthcheck failed: ${data.url?.full}`,
      type: `${data.monitor.type}.healthcheck.down`,
    })

    /*
     * Can't do a simple if (!days) here because days can be zero
     */
    if (days !== null) {
      // FIXME: Make this treshold configurable
      if (days < 5) tools.alarm({
        context: tools.context(`tls.certificate.${tools.escape(data.url.full)}`),
        host: data?.url?.domain,
        module: data?.morio?.module?.name,
        title: `⏳ Certificate will expire in ${days} days: ${data?.url?.full}`,
        type: 'tls.certificate.expiry.imminent',
        tags: ['tls','certificate','expiry'],
      })
      // FIXME: Make this treshold configurable
      else if (days < 15) tools.notify({
        context: tools.context(`tls.certificate.${tools.escape(data.url.full)}`),
        host: data?.url?.domain,
        module: data?.morio?.module?.name,
        tags: ['tls','certificate','expiry'],
        title: `⏳ Certificate will expire in ${days} days: ${data?.url?.full}`,
        type: 'tls.certificate.expiry.approaching',
      })
    }
  }
}

export default handler

/*
 * Takes healthcheck data and returns and array with the key observations
 *
 * @param {object} data - The healthcheck data
 * @return {array} summary - An array holding:
 *   - up (1 or 0)
 *   - the ms it took
 *   - days until the certificate expires
 */
function healthcheckSummary (data, tools) {
  return [
    (upValues.indexOf(data.monitor.status.toLowerCase()) !== -1) ? 1 : 0,
    Math.ceil(data.monitor.duration.us/1000),
    (data.monitor.type === 'http' && data.tls && data.url?.schema === 'https')
      ? checkCertificateExpiry(data, tools)
      : null
  ]
}

/*
 * Checks certificate validity
 *
 * @param {object} data - The healthcheck data
 */
const checkCertificateExpiry = (data, tools) => {
  const seconds = Math.floor(
    (new Date(data.tls.certificate_not_valid_after).getTime()/1000)
    - tools.now()
  )

  return Math.floor(seconds / (24 * 3600))
}
