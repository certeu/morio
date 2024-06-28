import { store } from '../lib/utils.mjs'
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
   * Deploy a new set of settings
   */
  app.post('/settings', Settings.deploy)

  /*
   * Load the current (running) settings
   * This will return the saveSettings as stored in the store
   * Save settings means secrets are not decrypted
   */
  app.get('/settings', (req, res) => res.send(store.get('saveSettings', {})))

  /*
   * Load the available authentication/identity providers (IDPs)
   */
  app.get('/idps', Settings.getIdps)
}
