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
}

export const statusCodes = {
  0: 'Everything is ok',
  1: 'Morio is running in ephemeral mode',
  2: 'Morio is resolving the configuration',
  499: 'Morio status is unknown because it was never set',
}

export const statusCodeAsColor = (code) => code === 0 ? 'green' : code < 500 ? 'amber' : 'green'
