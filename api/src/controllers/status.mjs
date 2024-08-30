import { globDir } from '#shared/fs'
import { store } from '../lib/store.mjs'

/**
 * This status controller handles the Morio status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

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
