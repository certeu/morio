export const errors = {
  /*
   * Specific error for only in ephemeral mode' errors
   */
  'morio.core.ephemeral.required': {
    status: 409,
    title: 'Unavailable in ephemeral mode',
    detail: 'This endpoint is only available when Morio is running in ephemeral mode. Since this system has been set up, this endpoint is no longer available.',
  },
  /*
   * Specific error for when writing to the filesystem fails
   */
  'morio.core.fs.write.failed': {
    status: 500,
    title: 'Unable to write to filesystem',
    detail: 'An attempt to write to the filesystem failed unexpectedly. This warrants escalation.',
  },
  /*
   * Specific error for schema violations
   */
  'morio.core.schema.violation': {
    status: 400,
    title: 'This requires violates the data schema',
    detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
  },
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
}

export const serviceCodes = {
  core: 10,
  api: 11,
  ca: 12,
  broker: 13,
  db: 14,
  console: 15,
  ui: 16,
  proxy: 17,
  connector: 18,
  dbuilder: 19,
}

export const statusCodes = {
  0: 'Everything is ok',
  1: 'Morio is running in ephemeral mode',
  2: 'Morio is resolving the configuration',
  10: 'There is an issue with the core service',
  499: 'Morio status is unknown because it was never set',
}

export const statusCodeAsColor = (code) => code === 0 ? 'green' : code < 500 ? 'amber' : 'green'
