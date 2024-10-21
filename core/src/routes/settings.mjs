import { utils } from '../lib/utils.mjs'
import { Controller } from '#controllers/settings'

const Settings = new Controller()

/**
 * This method adds the settings routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Deploy an initial set of settings
   */
  app.post('/setup', Settings.setup)

  /*
   * Preseed an initial set of settings
   */
  app.post('/preseed', Settings.preseed)

  /*
   * Deploy a new set of settings
   */
  app.post('/settings', Settings.deploy)

  /*
   * Load (the sanitized version of) the current settings.
   * Which means they are not decrypted (no secrets).
   */
  app.get('/settings', (req, res) => res.send(utils.getSanitizedSettings()))

  /*
   * Hit this route to soft restart Morio
   */
  app.get('/restart', (req, res) => Settings.restart(req, res))

  /*
   * Hit this route to soft reseed Morio
   */
  app.get('/reseed', (req, res) => Settings.reseed(req, res))

  /*
   * Hit this route to export the key data
   */
  app.get('/export/keys', (req, res) => Settings.exportKeys(req, res))
}
