/**
 * Extract event data from the linux-system audit module
 *
 * @param {object} data - The data from kafka
 * @param {object} tools - The tools object
 * @return {object} event - The event data or false if no event is to be created
 */
export default function linuxSystemAudit (data={}, tools) {
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
  const host = tools.shortUuid(summary.host) // We'll use this a bunch
  switch (action) {

    // auditd configuration changed
    case 'changed-audit-configuration':
      if (summary.data?.op === 'add_rule') evt.title = `Auditd rule added`
      else if (summary.data?.op === 'remove_rule') evt.title = `Auditd rule removed`
      else if (summary.data?.op === 'set' && summary.data?.audit_enabled === "1") {
        evt.title = `Auditd audit enabled`
        if (summary.data.old === summary.data.audit_enabled) evt.title += ' (no change)'
        else evt.title += ' (was disabled)'
      }
      else evt.title = `Auditd configuration change`
      evt.title += ` on ${host}`
      break;

    // group created
    case 'added-group-account-to':
      evt.title = `New group ${data.group?.name} added by ${data.user?.name} on ${host}`
      break;

    // group removed
    case 'delete-group-account-from':
      evt.title = `Group ${data.group?.id} removed by ${data.user?.name} on ${host}`
      break;

    // sudo
    case 'ran-command':
      evt.title = `Privileged command execution by ${data.user?.name} on ${host}`
      break;

    // session start & end
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

  // FIXME: This is here for debugging, remove this later
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

/**
 * Helper method to extract common audit data
 *
 * @param {object} data - The data from kafka
 * @param {object} tools - The tools object
 * @return {object} summary - The summary object
 */
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


