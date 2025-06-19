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
Controller.prototype.status = async function (req, res) {
  return res.send(getStatus()).end()
}

/**
 * Get reload data / Used by API to bootstrap itself
 *
 * This returns the current status, config, settings, and so on.
 * Everything required for the API to find its feet.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getReloadData = async function (req, res) {
  const data = getStatus()
  if (!utils.isEphemeral()) {
    data.sanitized_settings = utils.getSanitizedSettings()
    data.settings = utils.getSettings()
    data.keys = utils.getKeys()
  } else
    data.subca = utils.getSubcaSerial()
      ? {
          serial: utils.getSubcaSerial(),
          csr: utils.getSubcaCsr(),
        }
      : false

  data.presets = utils.getPresets()

  return res.status(200).send(data)
}

/*
 * Helper method to construct the status object
 */
function getStatus() {
  const ephemeral = utils.isEphemeral()
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
      cluster: ephemeral ? undefined : utils.getClusterUuid(),
      node: ephemeral ? undefined : utils.getNodeUuid(),
      node_serial: ephemeral ? undefined : utils.getNodeSerial(),
      ephemeral,
      ephemeral_uuid: ephemeral ? utils.getEphemeralUuid() : undefined,
      subca_serial: ephemeral ? utils.getSubcaSerial() : undefined,
      subca_csr: ephemeral ? utils.getSubcaCsr() : undefined,
      reload_count: utils.getReloadCount(),
      config_resolved: utils.isConfigResolved(),
      settings_serial: utils.getSettingsSerial(),
    },
  }
  if (statusCodes[data.status.cluster.code])
    data.status.cluster.msg = statusCodes[data.status.cluster.code]

  return data
}
