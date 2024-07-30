export const errors = {
  /*
   * 404 error, API style
   */
  'morio.core.404': {
    status: 404,
    title: 'No such API endpoint',
    detail: 'This is the API equivalent of a 404 page. The endpoint you requested does not exist.',
  },
  /*
   * Error for only in ephemeral mode' errors
   */
  'morio.core.ephemeral.required': {
    status: 409,
    title: 'Only available in ephemeral mode',
    detail:
      'This endpoint is only available when Morio is running in ephemeral mode. Since this system has been set up, this endpoint is no longer available.',
  },
  /*
   * Error for not in ephemeral mode' errors
   */
  'morio.core.ephemeral.prohibited': {
    status: 409,
    title: 'Not available in ephemeral mode',
    detail:
      'This endpoint is not available when Morio is running in ephemeral mode. Since this system has not yet been set up, this endpoint is not yet available.',
  },
  /*
   * Error for not while reloading errors
   */
  'morio.core.reloading.prohibited': {
    status: 409,
    title: 'Not available while reloading',
    detail:
      'This endpoint is not available when Morio is reloading its configuration. As Morio is reloading now, this endpoint is momentarily unavailable.',
  },
  /*
   * Error for when writing to the filesystem fails
   */
  'morio.core.fs.write.failed': {
    status: 500,
    title: 'Unable to write to filesystem',
    detail: 'An attempt to write to the filesystem failed unexpectedly. This warrants escalation.',
  },
  /*
   * Error for schema violations
   */
  'morio.core.schema.violation': {
    status: 400,
    title: 'This request violates the data schema',
    detail:
      'The request data failed validation against the Morio data schema. This means the request is invalid.',
  },
  /*
   * Error for invalid settings
   */
  'morio.core.settings.invalid': {
    status: 400,
    title: 'These settings are invalid',
    detail:
      'The provided settings failed validation against the Morio data schema, or are invalid for some other reason.',
  },
  /*
   * Error for when the settings are deployed on a host that's not listed as a node
   */
  'morio.core.settings.fqdn.mismatch': {
    status: 400,
    title: 'Settings FQDN mismatch',
    detail:
      'The provided settings do not include the FQDN used to submit this request. This mismatch indicates the settings are unlikely to be correct.',
  },
  /*
   * Error for when the settings are deployed on a host that's not listed as a node
   */
  'morio.core.checksum.mismatch': {
    status: 400,
    title: 'Data checksum mismatch',
    detail:
      'The data checksum could not be matched. This mismatch indicates a lack of common ground between both nodes.',
  },
}
