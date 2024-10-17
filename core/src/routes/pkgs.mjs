import { Controller } from '#controllers/pkgs'

const Pkgs = new Controller()

/**
 * This method adds the pkgs routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Get the defaults for generating a .deb client package
   */
  app.get(`/pkgs/clients/deb/defaults`, (req, res) =>
    Pkgs.getClientPackageDefaults(req, res, 'deb')
  )

  /*
   * Build a .deb client package
   */
  app.post(`/pkgs/clients/deb/build`, (req, res) => Pkgs.buildClientPackage(req, res, 'deb'))

  /*
   * Get the defaults for generating a .deb client-repo package
   */
  app.get(`/pkgs/repos/deb/defaults`, (req, res) =>
    Pkgs.getRepoPackageDefaults(req, res, 'deb')
  )

  /*
   * Build a .deb client package
   */
  app.post(`/pkgs/repos/deb/build`, (req, res) => Pkgs.buildRepoPackage(req, res, 'deb'))
}
