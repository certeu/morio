import { log, utils } from '../lib/utils.mjs'
import { globDir } from '#shared/fs'
import { flags } from '#config/flags'
import path from 'path'

/**
 * This Dconf controller handles API access to dynamic configuration
 *
 * @returns {object} Controller - The cache controller object
 */
export function Controller() {}

/**
 * Retrieve UI data for the tap service
 *
 * NOTE: Please don't abuse this, as it scans files on
 * disk and does a dynamic import. So it's not super fast.
 * This is also gated behind the operator role.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.tap = async function (req, res) {
  const tap = await loadTapUiConfig()

  return tap
    ? res.send(tap)
    : utils.sendErrorResponse(res, 'morio.api.info.unavailable', req.url)
}

async function loadTapUiConfig() {
  const folder = path.resolve("../tap/processors")
  const list = await globDir(folder)

  /*
   * First, iterate over all files
   */
  const processors = {}
  for (const file of list) {
    const processor = file.split('/')[4]
    if (typeof processors[processor] === 'undefined') {
      processors[processor] = { module_files: [] }
    }
    if (file.includes('/modules/') && file.slice(-4) === '.mjs' && path.basename(file) !== 'index.mjs') {
      processors[processor].module_files.push(file)
    }
  }

  /*
   * Now iterate over the (stream) processors
   * and dynamically import them
   */
  const ui = {}
  for (const processor of Object.keys(processors)) {
    // Load main info dynamically
    const info = await dynamicImport(`${folder}/${processor}/index.mjs`, 'info')
    if (info) {
      ui[processor] = info
      // Iterate over module files (if any)
      if (Array.isArray(processors[processor].module_files) && processors[processor].module_files.length > 0) {
        ui[processor].modules = {}
        for (const file of processors[processor].module_files) {
          const info = await dynamicImport(file, 'info')
          const mod = path.basename(file).slice(0, -4)
          if (info) ui[processor].modules[mod] = info
        }
      }
    }
  }

  return ui
}

/**
 * Retrieve feature flag settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.flags = async function (req, res) {
  const allFlags = {
    ...flags,
    ...utils.getSettings('flags', {}),
  }

  return res.send(allFlags)
}

async function dynamicImport(file, key='info') {
  let data = false
  try {
    const result = await import(file)
    if (typeof result[key] !== 'undefined') data = result[key]
  }
  catch (err) {
    log.warn({file, err}, `Failed to import file`)
  }

  return data
}
