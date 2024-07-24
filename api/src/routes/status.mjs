import { Controller } from '#controllers/status'

const Status = new Controller()

/**
 * This method adds the status routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * Hit this route to get the Morio status
   */
  app.get(`/status`, Status.status)
  app.get(`/status/`, Status.status)

  /*
   * Hit this route to get the Morio info (no core outreach)
   */
  app.get(`/info`, Status.info)

  /*
   * Hit this route to get the Morio status logs
   */
  app.get(`/status_logs`, Status.statusLogs)

  /*
   * Hit this route to get the available downloads
   */
  app.get(`/downloads`, Status.listDownloads)

  /*
   * Hit this route to get the running settings
   */
  app.get(`/settings`, Status.getSettings)

  /*
   * This route is called by core after reconfiguring itself
   */
  app.get(`/reconfigure`, (req, res) => Status.reconfigure(req, res))
}
