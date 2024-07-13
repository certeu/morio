import { Controller } from '#controllers/status'
import { utils } from '../lib/utils.mjs'

const Status = new Controller()

/**
 * This method adds the status routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = utils.getPrefix()

  /*
   * Hit this route to get the Morio status
   */
  app.get(`${PREFIX}/status`, Status.status)
  app.get(`${PREFIX}/status/`, Status.status)

  /*
   * Hit this route to get the Morio info (no core outreach)
   */
  app.get(`${PREFIX}/info`, Status.info)

  /*
   * Hit this route to get the Morio status logs
   */
  app.get(`${PREFIX}/status_logs`, Status.statusLogs)

  /*
   * Hit this route to get the available downloads
   */
  app.get(`${PREFIX}/downloads`, Status.listDownloads)

  /*
   * Hit this route to get the running settings
   */
  app.get(`${PREFIX}/settings`, Status.getSettings)

  /*
   * This route is called by core after reconfiguring itself
   */
  app.get(`${PREFIX}/reconfigure`, (req, res) => Status.reconfigure(req, res))
}
