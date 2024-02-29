import { Controller } from '#controllers/status'
import { store } from '../lib/store.mjs'

const Status = new Controller()

/**
 * This method adds the status routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = store.prefix

  /*
   * Hit this route to get the Morio status
   */
  app.get(`${PREFIX}/status`, Status.status)

  /*
   * Hit this route to get the Morio status
   */
  app.get(`${PREFIX}/status_logs`, Status.statusLogs)

  /*
   * Hit this route to get the available downloads
   */
  app.get(`${PREFIX}/downloads`, Status.listDownloads)
}
