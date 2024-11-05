/*
 * Morio feature flags
 */
export const fdocs = {}
export const flags = {}

/*
 * Disable the apikey identity provider
 */
fdocs.DISABLE_IDP_APIKEY = `Enable this flag to disable the \`apikey\` identity
provider thereby blocking authentication via API Keys.`
flags.DISABLE_IDP_APIKEY = false

/*
 * Disable the ldap identity provider
 */
fdocs.DISABLE_IDP_LDAP = `Enable this flag to disable the \`ldap\` identity
provider thereby blocking authentication via any LDAP backend.`
flags.DISABLE_IDP_LDAP = false

/*
 * Disable the local identity provider
 */
fdocs.DISABLE_IDP_LOCAL = `Enable this flag to disable the \`local\` identity
provider thereby blocking authentication via local Morio accounts.`
flags.DISABLE_IDP_LOCAL = false

/*
 * Disable the mrt identity provider
 */
fdocs.DISABLE_IDP_MRT = `Enable this flag to disable the \`mrt\` identity
provider thereby blocking authentication via Morio Root Token.

Note that if you enable this flag in your initial settings, you will have
effectively locked yourself out of your Morio deployment unless you have also
included an alternative identity provider.

As such, we recommend to not enable this flag until after you have made sure
you have an alternative identity provider that you know is functioning as
expected.`
flags.DISABLE_IDP_MRT = false

/*
 * Disable the iodc identity provider
 */
fdocs.DISABLE_IDP_OIDC = `Enable this flag to disable the \`oidc\` identity
provider thereby blocking authentication via any OpenID Connect backend.`
flags.DISABLE_IDP_OIDC = false

/*
 * Disable the UI service
 */
fdocs.DISABLE_SERVICE_UI = `Enable this flag to disable the UI service and run Morio in headless mode where you can only use the API to manage it.`
flags.DISABLE_SERVICE_UI = false

/*
 * Enforces mTLS on all HTTP endpoints
 */
fdocs.ENFORCE_HTTP_MTLS = `Enable this feature flag to enforce \`mTLS\` on all
HTTP endpoints.

The purpose of this feature flag is to add an extra layer of defence so prevent
anyone from being able to establish an HTTP connection to your Morio instance.
This is useful when deploying Morio in hostile environments, such as on the
Internet.

The extra mTLS authentication comes in addition to Morio’s standard HTTP
authentication.  In other words, this is not a replacement for any other
authentication, but adds an extra authentication layer.`
flags.ENFORCE_HTTP_MTLS = false

/*
 * Reseed the config when reloading/restarting
 */
fdocs.RESEED_ON_RELOAD = `Enable this flag to reseed Morio when reloading.

This flag comes into play when you have have preseed.git settings that make
Morio clone a git repository locally. This gives you various ways to keep your
configuration under version control, as outlined in the Preseeding Guide.

By default, Morio will not re-clone the repository when you make a
configuration change, or when you restart Morio. Instead, it will only update
the git repository from the remote when you explicitly reseed Morio through the
reseed API endpoint, (or via the UI which uses this endpoint under the hood).

When you enable this flag, Morio will reseed (thus update the local git
content from the remote) whenever you restart it, or update its
configuration.`
flags.RESEED_ON_RELOAD = false

