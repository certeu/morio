import { globDir } from '#shared/fs'
import { store, utils, log } from '../lib/utils.mjs'
import { reload } from '../index.mjs'

/**
 * This status controller handles the Morio status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

/**
 * Reconfigure
 *
 * This route is called from core, it triggers a reload of the config
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reconfigure = async (req, res) => {
  /*
   * Just get the status from core and pass it with some tweaks
   */
  log.debug('Reveived reconfigure signal from core')
  await relaod()
  log.debug('Reload complete')

  return res.status(200).send({})
}

/**
 * Status
 *
 * This returns the current status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.status = async (req, res) => {
  console.log('in status')
  /*
   * Get the status from core to ensure we have the latest info
   */
  const [status, result] = await utils.core.get(`/status`)

  if (status !== 200) return utils.sendErrorResponse(res, {
    type: `morio.api.status.core.fetch.${status}`,
    title: 'Unable to load status data from Morio Core',
    status: 503,
    detail: 'When reaching out to Morio Core, we were unable to retrieve the data to complete this request'
  })

  /*
   * Update store with relevant data
   */
  store.set('state.ephemeral', result.state.ephemeral)
  store.set('state.core', result.state)
  store.set('state.core.timestamp', Date.now())
  store.set('info.core', result.info)

  /*
   * Now return data
   */
  return res.send({
    info: {
      name: store.get('info.name'),
      about: store.get('info.about'),
      version: store.get('info.version'),
      production: store.get('info.production'),
      core: {
        name: store.get('info.core.name'),
        about: store.get('info.core.about'),
        version: store.get('info.core.version'),
        production: store.get('info.core.production'),
      },
    },
    state: {
      ephemeral: utils.isEphemeral(),
      uptime: Math.floor((Date.now() - store.get('state.start_time')) / 1000),
      start_time: store.get('state.start_time'),
      reload_count: store.get('state.reload_count'),
      config_resolved: store.get('state.config_resolved'),
      // config_resolved
      // reload_time
      // ephemeral
      core:  store.get('state.core'),
      //uptime
      //ephemeral
      //reconfigure_count
      //timestamp
    }
  })
}

/**
 * Info
 *
 * This returns the current info
 *
 * Unlike the status endpoint, this does not reach out to core
 * but instead returns the most recent info from the store.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.info = async (req, res) => res.send(store.info)

/**
 * Status logs
 *
 * This returns the status logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.statusLogs = async (req, res) => {
  /*
   * Just get the status from core and pass it
   */
  const [status, result] = await utils.core.get(`/status_logs`)

  return res.status(status).send(result)
}

/**
 * List downloads
 *
 * This returns a list of files in the downloads folder
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listDownloads = async (req, res) => {
  const list = await globDir('/morio/downloads')

  if (list) return res.send(list.map((file) => file.replace('/morio/downloads', '/downloads')))
  else return res.status(500).send({ errors: ['Failed to read file list'] })
}
