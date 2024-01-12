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
   * Deploy a new configuration
   */
  app.post('/config/deploy', (req, res) => Config.deploy(req, res, tools))

  /*
   * Load a list of all configurations
   */
  app.get('/configs', (req, res) => Config.getConfigsList(req, res, tools))

  /*
   * Load the current (running) configuration
   */
  app.get('/configs/current', (req, res) => Config.getCurrentConfig(req, res, tools))

  /*
   * Load the CA configuration
   */
  app.get('/configs/ca', (req, res) => Config.getCaConfig(req, res, tools))

  /*
   * Load a confiration by timestamp
   */
  app.get('/configs/:timestamp', (req, res) => Config.getConfig(req, res, tools))

  /*
   * Load the defaults
   */
  app.get('/defaults', (req, res) => Config.getDefaults(req, res, tools))
}
