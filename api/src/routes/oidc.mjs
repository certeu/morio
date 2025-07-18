import { Controller } from '#controllers/oidc'

const Oidc = new Controller()

/**
 * This method adds the OIDC routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  // Initialize OIDC flow
  app.get('/interaction/:uid', (req, res) => Oidc.init(req, res))

  // OIDC login
  app.post('/interaction/:uid/login', (req, res) => Oidc.login(req, res))

  // OIDC consent
  app.post('/interaction/:uid/confirm', (req, res) => Oidc.confirm(req, res))

  // List OIDC clients (for the account)
  app.get('/oidc/clients', (req, res) => Oidc.getClients(req, res))

  // Create OIDC client
  app.post('/oidc/client', (req, res) => Oidc.createClient(req, res))

  // Update OIDC client
  app.patch('/oidc/clients/:id', (req, res) => Oidc.updateClient(req, res))

  // Delete OIDC client
  app.delete('/oidc/clients/:id', (req, res) => Oidc.removeClient(req, res))
}
