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
   * Hit this route to get the Morio info (no core outreach)
   */
  app.get(`${PREFIX}/info`, Status.info)

  /*
   * Hit this route to get the available downloads
   */
  app.get(`${PREFIX}/downloads`, Status.listDownloads)
}
