import { Controller } from '#controllers/oidc'
import bodyParser from 'body-parser'

const Oidc = new Controller()
const urlencodedParser = bodyParser.urlencoded()

/**
 * This method adds the OIDC routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  // Initialize OIDC flow
  app.get('/interaction/:uid', (req, res) => Oidc.init(req, res))

  // OIDC login
  app.post('/interaction/:uid/login', urlencodedParser, (req, res) => Oidc.login(req, res))

  // OIDC consent
  app.post('/interaction/:uid/confirm', urlencodedParser, (req, res) => Oidc.confirm(req, res))

  // List OIDC clients (for the account)
  app.get('/oidc/clients', (req, res) => Oidc.getClients(req, res))

  // Create OIDC client
  app.post('/oidc/client', (req, res) => Oidc.createClient(req, res))

  // Update OIDC client
  app.patch('/oidc/clients/:id', (req, res) => Oidc.updateClient(req, res))

  // Delete OIDC client
  app.delete('/oidc/clients/:id', (req, res) => Oidc.removeClient(req, res))
}
