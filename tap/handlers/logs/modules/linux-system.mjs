/**
 * A method to determine logset and logline for the linux-system module
 *
 * @param {object} data - The full message from RedPanda
 * @param {object} tools - The tools object
 * @return {array} result - A [logset(string), logline(string)] array
 */
export default function linuxSystemLogs (data={}, tools) {

  /*
   * Log files read from disk
   */
  if (data?.log?.file?.path && data?.message) {
    return [ data.log.file.path, data.message ]
  }

  /*
   * Logs from journald
   */
  if (data?.input?.type === 'journald') {
    let logset = false
    const t = 'journald'
    if (data?.container?.name) logset = `${t}.container.${data.container.name}`
    else if (data?.journald?.process?.name) logset = `${t}.process.${data.journald.process.name}`
    else if (data?.syslog?.identifier) logset = `${t}.syslog.${data?.syslog?.identifier}`
    else logset = `${t}.generic`

    return [ logset, data?.message ]
  }

  /*
   * If we don't know, defer to default cachine
   */
  return [false, false]
}

export const info = {
  name: 'Logs stream plugin: linux-system',
  about: `This stream processor plugin will process log data from the linux-system module.`,
}

