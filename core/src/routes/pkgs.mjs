/*
 * Import the Pkgs controller
 */
import { Controller } from '#controllers/pkgs'

/*
 * Instantiate the controller
 */
const Pkgs = new Controller()

/**
 * This method adds the pkgs routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Get the defaults for generating a .deb client package
   */
  app.get(`/pkgs/clients/deb/defaults`, (req, res) => Pkgs.getClientPackageDefaults(req, res, tools, 'deb'))

  /*
   * Build a .deb client package
   */
  app.post(`/pkgs/clients/deb/build`, (req, res) => Pkgs.buildClientPackage(req, res, tools, 'deb'))
}
