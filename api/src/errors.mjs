export const errors = {
  /*
   * Block routes in ephemeral mode
   */
  'morio.api.middleware.routeguard.ephemeral': {
    status: 503,
    title: 'This endpoint is not available when Morio is in ephemeral state',
    detail: 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.'
  },
  /*
   * Block routes while reloading
   */
  'morio.api.middleware.routeguard.reloading': {
    status: 503,
    title: 'This endpoint is not available while the Morio API is reloading',
    detail: 'While the Morio API is reloading, only a subset of endpoints are available.'
  },
  /*
   * Status issues coming from core
   */
  'morio.api.core.status.503': {
    status: 503,
    title: 'Unable to load status data from Morio Core',
    detail: 'When reaching out to Morio Core, we received a status code 503.'
  },
  /*
   * Failed to retrieve info data
   */
  'morio.api.info.unavailable': {
    status: 503,
    title: 'Unable to load info data from the internal API state',
    detail: 'We were unable to retrieve the API info from the internal state.',
  },
  /*
   * Failed to retrieve API list from database
   */
  'morio.api.apikeys.list.failed': {
    status: 503,
    title: 'Unable to load the list of API keys from the database',
    detail: 'When reaching out to the Morio Database, we were unable to retrieve the data to complete this request'
  },
  /*
   * Specific error for schema violations
   */
  'morio.api.schema.violation': {
    status: 400,
    title: 'This request violates the data schema',
    detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
  },
}

