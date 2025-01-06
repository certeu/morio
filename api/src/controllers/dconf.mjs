import { log, utils } from '../lib/utils.mjs'
import { globDir } from '#shared/fs'
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
  const folder = path.resolve("../tap/handlers")
  const list = await globDir(folder)

  /*
   * First, iterate over all files
   */
  const handlers = {}
  for (const file of list) {
    const handler = file.split('/')[4]
    if (typeof handlers[handler] === 'undefined'
      && handler.slice(0, 7) !== 'builtin' //FIXME
    ) {
      handlers[handler] = { module_files: [] }
    }
    if (file.includes('/modules/') && file.slice(-4) === '.mjs' && path.basename(file) !== 'index.mjs') {
      handlers[handler].module_files.push(file)
    }
  }

  /*
   * Now iterate over handlers and dynamically import them
   */
  const ui = {}
  for (const handler of Object.keys(handlers)) {
    // Load main info dynamically
    const info = await dynamicImport(`${folder}/${handler}/index.mjs`, 'info')
    if (info) {
      ui[handler] = info
      // Iterate over module files (if any)
      if (Array.isArray(handlers[handler].module_files) && handlers[handler].module_files.length > 0) {
        ui[handler].modules = {}
        for (const file of handlers[handler].module_files) {
          const info = await dynamicImport(file, 'info')
          const mod = path.basename(file).slice(0, -4)
          if (info) ui[handler].modules[mod] = info
        }
      }
    }
  }

  return ui
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
