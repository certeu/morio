/*
 * Import the config controller
 */
import { Controller } from '#controllers/config'

/*
 * Instantiate the controller
 */
const Config = new Controller()

// prettier-ignore
/**
 * This method adds the config routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Load the current (running) configuration
   */
  app.get('/config', (req, res) => res.send(tools.config))

  /*
   * Load the current presets
   */
  app.get('/presets', (req, res) => res.send(tools.presets))

  /*
   * Load the CA configuration
   */
  app.get('/configs/ca', (req, res) => Config.getCaConfig(req, res, tools))

  /*
   * Load the defaults
   */
  app.get('/defaults', (req, res) => Config.getDefaults(req, res, tools))
}
