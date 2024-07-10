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
}

