/*
 * Import the settings controller
 */
import { Controller } from '#controllers/settings'

/*
 * Instantiate the controller
 */
const Settings = new Controller()

// prettier-ignore
/**
 * This method adds the config routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Deploy an initial set of settings
   */
  app.post('/setup', (req, res) => Settings.setup(req, res, tools))

  /*
   * Deploy a new set of settings
   */
  app.post('/settings', (req, res) => Settings.deploy(req, res, tools))

  /*
   * Load a list of all settings
   */
  app.get('/settings', (req, res) => Settings.getSettingsList(req, res, tools))

  /*
   * Load the current (running) settings
   */
  app.get('/settings/current', (req, res) => res.send({
    ...tools.settings,
    metadata: {
      version: tools.config?.settings,
      comment: tools.config?.comment,
    }
  }))

  /*
   * Load settings by timestamp
   */
  app.get('/settings/:timestamp', (req, res) => Settings.getSettings(req, res, tools))
}
