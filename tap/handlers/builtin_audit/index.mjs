import { config } from "./config.mjs"

/*
 * This is a Morio handler to process audit data collected by the Morio client.
 * It can create events to highlight relevant events, and cache audit data.
 */
const handler = config.enabled ? {
  ...config,
  method: (data, tools, topic) => {
    /*
     * Do not handle hosts that lack an ID
     */
    if (!data.host.id) tools.note(`Host lacks ID: : ${JSON.stringify(data)}`)

    /*
     * Only handle hosts when we know how to
     * transform data from the Morio module that generated it
     */
    if (!data?.morio?.module || typeof processAuditData[data.morio.module] !== 'function') {
      tools.note(`Cannot handle audit event ${data.event?.action}`, data)
      return
    }

    /*
     * Transform audit data to an audit cache entry
     */
    const result = processAuditData[data.morio.module](data, tools)

    /*
     * Only update if we have an event
     */
    if (result) tools.cache.audit(result)
  }
} : false

export default handler

function auditSummary (data, tools) {
  const summary = {
    // Time of the event
    time: tools.extract.timestamp(data),
    // Host
    host: tools.extract.host(data),
    // Module
    module: tools.extract.module(data),
    // Source event
    sid: `audit.${tools.extract.id(data)}`,
  }
  // User
  if (data.user) {
    summary.user = data.user
    // This is too chatty
    if (summary.user.audit) delete (summary.user.audit)
    if (summary.user.selinux) delete (summary.user.selinux)
  }
  // Process
  if (data.process) summary.process = data.process
  // (auditd) result
  if (typeof data.auditd?.result !== 'undefined') summary.result = data.auditd.result
  // (auditd) data
  if (data.auditd?.data) summary.data = data.auditd.data

  return summary
}

const processAuditData = {
  /**
   * Extract event data from the linux-system audit module
   *
   * @param {object} data - The data from kafka
   * @param {object} tools - The tools object
   * @return {object} event - The event data or false if no event is to be created
   */
  'linux-system': function linuxSystemAudit (data={}, tools) {

    /*
     * Only continue if there's an audit action
     */
    const action = data.event?.action
    if (!action) return false

    /*
     * Create the base data structure
     */
    const summary = auditSummary(data, tools)
    let evt = {
      ...summary,
      title: 'Audit event without a title',
      type: `${summary.module}.${action}`,
    }
    if (!evt.data) evt.data = {}

    /*
     * Now enrich the data based on the action
     */
    const host = tools.shortUuid(summary.host)
    switch (action) {
      case 'added-group-account-to':
        evt.title = `New group ${data.group?.name} added by ${data.user?.name} on ${host}`
        break;
      case 'changed-audit-configuration':
        if (summary.data?.op === 'add_rule') evt.title = `Auditd rule added`
        else if (summary.data?.op === 'remove_rule') evt.title = `Auditd rule removed`
        else if (
          summary.data?.op === 'set' &&
          summary.data?.audit_enabled === "1"
        ) evt.title = `Auditd audit enabled (${summary.data.old === summary.data.audit_enabled ? 'no change' : 'was disabled'})`
        else evt.title = `Auditd configuration change`
        evt.title += ` on ${host}`
        break;
      case 'delete-group-account-from':
        evt.title = `Group ${data.group?.id} removed by ${data.user?.name} on ${host}`
        break;
      case 'ran-command':
        evt.title = `Privileged command execution by ${data.user?.name} on ${host}`
        break;
      case 'started-session':
      case 'ended-session':
        const type = action.split('-')[0]
        evt.title = `Session ${type} by ${data.user?.name}`
        if (data.user?.effective?.name) evt.title += ` (as ${data.user?.effective?.name})`
        evt.title += ` ${summary.data?.terminal} on ${tools.shortUuid(summary.host)}`
        break;

      default:
        evt = false
    }

    if (![
      "existing_user",
      "ended-session",
      "started-session",
      "disposed-credentials",
      "refreshed-credentials",
      "ran-command",
      "deleted-group-account-from",
      "added-group-account-to",
    ].includes(action)) tools.note(`Audit event: ${action}`, { evt, data })

    return evt
  }
}



