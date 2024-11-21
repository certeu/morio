import { config } from "./config.mjs"

/*
 * This is a Morio handler to cache recent log lines
 *
 * It will set two cache keys:
 *
 *   - log|[data.host.id]|[data.morio.module.name]|[data.log.file.path]
 *     => Will hold the recent log lines
 *   - log|[host.id\
 *     => Will hold a hash with
 *        - module names as fields
 *        - a list of log files as value
 */
const handler = config.enabled ? {
  ...config.handler,
  method: ({ data }, tools) => {
    /*
     * Only handle data that has a log message
     */
    if (!data?.message) return tools.cache.note('Invalid log data', data)

    /*
     * Figure out what cache key to use
     */
    let logId = false
    // Regular logs read from a file
    if (data?.log?.file?.path) logId = data.log.file.path
    // Logs from journald
    if (data?.input?.type === 'journald') {
      if (data?.container?.name) logId = `journald.container.${data.container.name}`
      else if (data?.journald?.process?.name) logId = `journald.process.${data.journald.process.name}`
      else `journald.generic`
    }

    /*
     * Only cache what we understand
     */
    if (!logId) return tools.cache.note('Failed to extract logId from data', data)

    /*
     * Update the cache
     */
    tools.cache.logline(logId, data, config.cache_lines, config.expire_seconds)
  }
} : null

export default handler

