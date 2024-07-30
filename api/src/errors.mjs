export const errors = {
  /*
   * 404 error, API style
   */
  'morio.api.404': {
    status: 404,
    title: 'No such API endpoint',
    detail: 'This is the API equivalent of a 404 page. The endpoint you requested does not exist.',
  },
  /*
   * Error for only in ephemeral mode' errors
   */
  'morio.api.ephemeral.required': {
    status: 409,
    title: 'Only available in ephemeral mode',
    detail:
      'This endpoint is only available when Morio is running in ephemeral mode. Since this system has been set up, this endpoint is no longer available.',
  },
  /*
   * Error for not in ephemeral mode' errors
   */
  'morio.api.ephemeral.prohibited': {
    status: 409,
    title: 'Not available in ephemeral mode',
    detail:
      'This endpoint is not available when Morio is running in ephemeral mode. Since this system has not yet been set up, this endpoint is not yet available.',
  },
  /*
   * Error for not in ephemeral mode' errors
   */
  'morio.api.reloading.prohibited': {
    status: 409,
    title: 'Not available while reloading',
    detail:
      'This endpoint is not available when Morio is reloading its configuration. As Morio is reloading now, this endpoint is momentarily unavailable.',
  },
  /*
   * Status issues coming from core
   */
  'morio.api.core.status.503': {
    status: 503,
    title: 'Unable to load status data from Morio Core',
    detail: 'When reaching out to Morio Core, we received a status code 503.',
  },
  /*
   * Status issues coming from core when it does not response
   */
  'morio.api.core.status.undefined': {
    status: 503,
    title: 'Unable to load data from Morio Core',
    detail: 'When reaching out to Morio Core, we did not receive a response, idicating that core may be down.',
  },
  /*
   * Status issues coming from core
   */
  'morio.api.input.malformed': {
    status: 503,
    title: 'Input malformed',
    detail: 'The input provided is malformed.',
  },
  /*
   * Failed to retrieve info data
   */
  'morio.api.info.unavailable': {
    status: 503,
    title: 'Unable to load the requested data',
    detail: 'We were unable to retrieve the requested data from the internal state.',
  },
  /*
   * Failed to retrieve API list from database
   */
  'morio.api.apikeys.list.failed': {
    status: 503,
    title: 'Unable to load the list of API keys from the database',
    detail:
      'When reaching out to the Morio Database, we were unable to retrieve the data to complete this request',
  },
  /*
   * Specific error for schema violations
   */
  'morio.api.schema.violation': {
    status: 400,
    title: 'This request violates the data schema',
    detail:
      'The request data failed validation against the Morio data schema. This means the request is invalid.',
  },
  /*
   * Error for invalid settings
   */
  'morio.api.settings.invalid': {
    status: 400,
    title: 'These settings are invalid',
    detail:
      'The provided settings failed validation against the Morio data schema, or are invalid for some other reason.',
  },
  /*
   * Error for undeployable settings
   */
  'morio.api.settings.undeployable': {
    status: 400,
    title: 'These settings are undeployable',
    detail: 'The provided settings would result in a configuration that cannot be deployed.',
  },
  /*
   * Error for creating an account that already exists
   */
  'morio.api.account.exists': {
    status: 409,
    title: 'Conflict with an existing account',
    detail: 'The provided data conflicts with an existing account.',
  },
  /*
   * Error for when an account is unknown/missing
   */
  'morio.api.account.unknown': {
    status: 404,
    title: 'Account unknown',
    detail: 'The provided account identifier could not be matched to an existing account.',
  },
  /*
   * Error for when an account is in a state that does not allow the current action
   */
  'morio.api.account.state.invalid': {
    status: 400,
    title: 'Account state is invalid',
    detail: 'The account is in a state that does not allow the current action.',
  },
  /*
   * Error for when a provided  account invite does not match what is stored
   * Seeing many of these could indicate an attempt to brute-force an invite
   */
  'morio.api.account.invite.mismatch': {
    status: 403,
    title: 'Account invite mismatch',
    detail: 'The provided account invite is incorrect.',
  },
  /*
   * Error for general purpose credentials mismatch
   */
  'morio.api.account.credentials.mismatch': {
    status: 403,
    title: 'Account credentials mismatch',
    detail: 'The provided account credentials are incorrect.',
  },
  /*
   * Error for when a role is not available to an account
   */
  'morio.api.account.role.unavailable': {
    status: 403,
    title: 'Role unavailable',
    detail: 'The requested role is not available to this account.',
  },
  /*
   * Error for when a role is too low to perform the current action
   */
  'morio.api.account.role.insufficient': {
    status: 403,
    title: 'Role insufficient',
    detail: 'This endpoint required a higher role.',
  },
  /*
   * Error for when a role is not sufficient to access and endpoint
   */
  'morio.api.rbac.denied': {
    status: 403,
    title: 'Denied by role-base access control',
    detail: 'The request did not pass the role based access control check.',
  },
  /*
   * Error for when a nominative account is required (no API key or MRT)
   */
  'morio.api.nominative.account.required': {
    status: 403,
    title: 'Nominative account required',
    detail: 'This action is only available to nominative accounts.',
  },
  /*
   * Error for when the required authentication headers aren't what we expected
   */
  'morio.api.authentication.required': {
    status: 401,
    title: 'Authentication required',
    detail: 'The request was not properly authenticated.',
  },
  /*
   * Error for when a database backend is not available or caused an error
   */
  'morio.api.db.failure': {
    status: 403,
    title: 'Database Failure',
    detail: 'Cannot authenticate because the database returned an error.',
  },
  /*
   * Error for when an identity provider is not available or caused an error
   */
  'morio.api.idp.failure': {
    status: 403,
    title: 'Identity Provider Failure',
    detail: 'Cannot authenticate because the identity provider returned an error.',
  },
  /*
   * Error for when an identity provider is not known
   */
  'morio.api.idp.unknown': {
    status: 403,
    title: 'Identity Provider Unknown',
    detail: 'Cannot authenticate because the identity provider is unknown.',
  },
}
