import { globDir } from '#shared/fs'
import { validateSettings } from '#lib/validate-settings'
import { keypairAsJwk } from '#shared/crypto'
import { utils } from '../lib/utils.mjs'

/**
 * This anonymous controller handles various public endpoints
 *
 * In other words, there's no authentication or RBAC here,
 * all requests are anonymous (hence the name).
 *
 * @returns {object} Controller - The anonymous controller object
 */
export function Controller() {}

/**
 * Gets CA root certificates and fingerprint
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getCaCerts = async (req, res) => {
  const keys = utils.getKeys()

  return keys.rfpr && keys.rcrt && keys.icrt
    ? res.send({
        root_fingerprint: keys.rfpr,
        root_certificate: keys.rcrt,
        intermediate_certificate: keys.icrt,
      })
    : utils.sendErrorResponse(res, `morio.api.info.unavailable`, req.url)
}

/**
 * Loads the available idenitity/authentication providers (IDPs)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getIdps = async (req, res) => {
  const idps = {}

  /*
   * Add the IDPs configured by the user
   */
  const providers = utils.getSettings('iam.providers', {})
  if (providers) {
    for (const [id, conf] of Object.entries(providers)) {
      idps[id] = {
        id,
        provider: id === 'mrt' ? 'mrt' : conf.provider,
        label: conf.label,
        about: conf.about || false,
      }
    }
  }

  /*
   * Add the root token IDP, unless it's disabled by a feature flag
   */
  if (!utils.getFlag('DISABLE_ROOT_TOKEN')) {
    // TODO: Why is this commented out?
    //idps['Root Token'] = { id: 'mrt', provider: 'mrt' }
  }

  /*
   * Return the list
   */
  return res.send({ idps, ui: utils.getSettings('iam.ui', {}) })
}

/**
 * This returns the JWKS info, used for Vault integration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getJwks = async (req, res) => {
  /*
   * Get JWKS info from public key
   */
  const jwks = await keypairAsJwk({ public: utils.getKeys().public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}

/**
 * Get status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getStatus = async (req, res) => {
  /*
   * Get the status from core to ensure we have the latest info
   */
  const [status, result] = await utils.coreClient.get(`/status`)

  if (status !== 200)
    return utils.sendErrorResponse(res, `morio.api.core.status.${status}`, req.url)

  /*
   * Update relevant data
   */
  utils.setEphemeral(result.node?.ephemeral ? true : false)
  utils.setCoreStatus(result)

  /*
   * Now return data
   */
  return res.send({
    info: utils.getInfo(),
    state: {
      ephemeral: utils.isEphemeral(),
      uptime: Math.floor((Date.now() - utils.getStartTime()) / 1000),
      start_time: utils.getStartTime(),
      reload_count: utils.getReloadCount(),
      config_resolved: utils.isConfigResolved(),
      settings_serial: utils.getSettingsSerial(),
    },
    core: utils.getCoreStatus(),
  })
}

/**
 * List downloads
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listDownloads = async (req, res) => {
  const list = await globDir('/morio/downloads')

  if (list) return res.send(list.map((file) => file.replace('/morio/downloads', '/downloads')))
  else return res.status(500).send({ errors: ['Failed to read file list'] })
}

/**
 * Validate Morio settings
 *
 * This allows people to validate a settings object prior to applying it.
 * Which should hopefully avoid at least some mistakes.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.validateSettings = async (req, res) => {
  /*
   * Run the settings validation helper, which takes proposed
   * and current settings and returns a report object
   */
  const report = await validateSettings(req.body)

  return res.send(report).end()
}
