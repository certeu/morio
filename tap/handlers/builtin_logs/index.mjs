import { config } from "./config.mjs"

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
    if (!data?.message) {
      tools.note(`No message field in data: ${JSON.stringify(data)}`)
      return
    }

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
} : null

export default handler

