/*
 * Morio feature flags
 */
export const flags = {}

/*
 * Disable the apikey identity provider
 */
flags.DISABLE_IDP_APIKEY = false

/*
 * Disable the ldap identity provider
 */
flags.DISABLE_IDP_LDAP = false

/*
 * Disable the local identity provider
 */
flags.DISABLE_IDP_LOCAL = false

/*
 * Disable the mrt identity provider
 */
flags.DISABLE_IDP_MRT = false

/*
 * Disable the iodc identity provider
 */
flags.DISABLE_IDP_OIDC = false

/*
 * Enforces mTLS on all HTTP endpoints
 */
flags.ENFORCE_HTTP_MTLS = false

/*
 * Disable the UI service
 */
flags.DISABLE_SERVICE_UI = false

