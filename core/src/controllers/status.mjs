import { utils } from '../lib/utils.mjs'
import { statusCodes } from '#shared/errors'

/**
 * This status controller handles the MORIO status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

/**
 * Status
 *
 * This returns the current status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.status = async (req, res) => res.send(getStatus()).end()

/**
 * Get reload data / Used by API to bootstrap itself
 *
 * This returns the current status, config, settings, and so on.
 * Everything required for the API to find its feet.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getReloadData = async (req, res) => {
  const data = getStatus()
  if (!utils.isEphemeral()) {
    data.sanitized_settings = utils.getSanitizedSettings()
    data.settings = utils.getSettings()
    data.keys = utils.getKeys()
  }
  data.presets = utils.getPresets()

  return res.status(200).send(data)
}

/*
 * Helper method to construct the status object
 */
const getStatus = () => {
  const data = {
    info: utils.getInfo(),
    status: {
      ...utils.getStatus(true),
      cluster_leader: {
        serial: utils.getLeaderSerial(),
        uuid: utils.getLeaderUuid(),
      },
    },
    nodes: utils.getClusterNodes(),
    node: {
      uptime: utils.getUptime(),
      cluster: utils.isEphemeral() ? undefined : utils.getClusterUuid(),
      node: utils.isEphemeral() ? undefined : utils.getNodeUuid(),
      node_serial: utils.isEphemeral() ? undefined : utils.getNodeSerial(),
      ephemeral: utils.isEphemeral(),
      ephemeral_uuid: utils.isEphemeral() ? utils.getEphemeralUuid() : undefined,
      reconfigure_count: utils.getReconfigureCount(),
      config_resolved: utils.isConfigResolved(),
      settings_serial: utils.getSettingsSerial(),
    },
  }
  if (statusCodes[data.status.cluster.code])
    data.status.cluster.msg = statusCodes[data.status.cluster.code]

  return data
}
