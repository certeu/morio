---
title: Identity Providers Guide
---

In Morio, all HTTP-based authentication is backed by Identity Providers (IDPs),
a modular way to configure authentication backends for your Morio deployment.

Currently, 4 types of identity providers are supported:

- [The `mrt` identity provider](#mrt) lets you authenticate via __the Morio Root Token__
- [The `apikey` identity provider](#apikey) lets you Authentication via an __API Key__
- [The `local` identity provider](#local) lets you Authentication via a __Local Morio Account__
- [The `ldap` identity provider](#ldap) lets you Authentication using an __LDAP account__, including LDAP-compatible backends such as Active Directory


## mrt

The provider named `mrt` is the __Morio Root Token__ provider.  
This provider allows authentication with the Morio Root Token.

**Purpose**

- The `mrt` provider is intended to be used as the very first Morio login before other identity providers are set up.
- The `mrt` provider also serves as a sort of _break glass_ fallback that can be used when other identity providers are unavailable.

**Restrictions**

- The `mrt` provider requires the _Morio Root Token_ to authenticate, which is created at the initial setup of Morio, and only shown at that time.
- The `mrt` provider only takes the _Morio Root Token_ as input, there is no username.
- You can only have 1 instance of the `mrt` provider, and its ID must always be `mrt`.

**Provider-specific functionality**

- None.

**Roles**

- The `mrt` provider grants you the `root` role, the highest role in a Morio system.
- The `mrt` provider supports dropping privileges by requesting any role lower than `root`.

**Configuration**

- The `mrt` provider is built-in, and does not require configuration.
- The `mrt` provider can be disabled with the [`DISABLE_IDP_MRT`](/docs/reference/flags/disable_idp_mrt/) feature flag.
- The `mrt` provider's inclusion and/or appearance on the UI'slogin page can be configured in the UI settings.

**Settings Example**

```yaml title="morio-settings.yaml"
iam: 
  providers:
    mrt: # No settings required, merely including it as a provider is sufficient
  ui:
    visibility:
      mrt: full # Anything other 'icon' will do
    order: 
      - mrt
```

## apikey

The provider named `apikey` is the __Morio API Keys__ provider.  
This provider allows authentication with a Morio API Keys and its matching secrets.

**Purpose**

- The `apikey` provider is intended for automated access, scripts, CI/CD pipelines, cron jobs, and so on.
- The `apikey` provider is not intended for human operators, although it is commonly used by developers when working on Morio API integration.

**Restrictions**


- The `apikey` provider does not allow choosing the API Key (username) or Secret (password).
- The `apikey` provider does not support dropping privileges by assuming a different role. Only the role assigned to the API Key can be used.
- You can only have 1 instance of the `apiekey` provider, and its ID must always be `apikey`.

**Provider-specific functionality**

- The `apikey` provider allows creating API Keys by any Morio.
- The [Morio Management API](/docs/guides/apis/api) providers [various endpoints to handle API Keys](/oas-api#tag/apikeys).

**Roles**

- The `apikey` provider allows for any role up to `engineer`, only the `root` role cannot be assigned to an API Key.
- The `apikey` provider does not allow creating an API Key with a role higher than one's own.


**Configuration**

- The `apikey` provider is built-in, and does not require configuration.
- The `apikey` provider can be disabled with the [`DISABLE_IDP_APIKEY`](/docs/reference/flags/disable_idp_apikey/) feature flag.
- The `apikey` provider's inclusion and/or appearance on the UI'slogin page can be configured in the UI settings.

**Settings Example**

```yaml title="morio-settings.yaml"
iam: 
  providers:
    apikey:
      provider: apikey # You cannot choose this, it must always be `apikey`
      id: apikey # You cannot choose this, it must always be `apikey`
      label: API Key # This you can choose :)
    mrt: 
  ui:
    visibility:
      apikey: icon # This will hide the identity provider behing a lock icon on the login page
      mrt: ok
    order: 
      - apikey
      - mrt
```

## local

The provider named `local` is the __Morio Local Users__ provider.  
This provider allows authentication with a the username, password, and TOTP token of a Local Morio User Account.

**Purpose**

- The `local` provider is intended for access by humans.
- The `local` provider is most suitable for smaller setups where no centralized identity provider (such as `ldap`) is avalable, or as a backup for when external identity providers are unavailable.

**Restrictions**

- The `local` provider requires Multi-Factor Authentication (MFA). This is non-optional, and cannot be disabled.
- You can only have 1 instance of the `local` provider, and its ID must always be `local`.

**Provider-specific functionality**

- The `local` provider allows any user with the role `manager` or higher to create local Morio accounts.
- The `local` provider generates an invite code and URL to be shared with users, facilitating onboarding.
- The `local` provider will provide _scratch codes_ to the user that can be used when their device used to generate the TOTP token is unavalable.
- The [Morio Management API](/docs/guides/apis/api) providers [various endpoints to handle Local Morio Accounts](/oas-api#tag/accounts).

**Roles**

- The `local` provider allows for any role up to `engineer`, only the `root` role cannot be assigned to a Local Morio Account.
- The `local` provider does not allow creating a local Morio account with a role higher than one's own.

**Configuration**

- The `local` provider is built-in, and does not require configuration.
- The `local` provider can be disabled with the [`DISABLE_IDP_LOCAL`](/docs/reference/flags/disable_idp_local/) feature flag.
- The `local` provider's inclusion and/or appearance on the UI'slogin page can be configured in the UI settings.

**Settings Example**

```yaml title="morio-settings.yaml"
iam: 
  providers:
    apikey:
      provider: apikey
      id: apikey
      label: API Key
    mrt: 
    local:
      provider: local # You cannot choose this, it must always be `local`
      id: local  # You cannot choose this, it must always be `local`
      label: Morio Account # This you can choose :)
  ui:
    visibility:
      apikey: icon
      local: ok
      mrt: icon
    order: 
      - apikey
      - local
      - mrt
```

## ldap

The provider named `ldap` is the __Morio LDAP__ provider.  
This provider allows against a pre-existing LDAP backend.

**Purpose**

- The `ldap` provider is intended for organisations that have pre-existing user identities available in an LDAP server, or a system compatible with LDAP, such as Microsoft Active Directory.
- The `ldap` provider is most suitable for environments where users already have an account on a different system that they also want to use to access Morio.

**Restrictions**

- None.

**Provider-specific functionality**

- The `ldap` provider allows configuring the assigned of Morio roles based on any field of the LDAP user object.
- The `ldap` provider supports more than 1 instance of this provider, thus allowing you to use different LDAP backends simultenously.

**Roles**

- The `local` provider allows for any role up to `engineer`, only the `root` role cannot be assigned to a user backed by the `ldap` provider.

**Configuration**

- The `ldap` provider needs to be configured before it can be used.
- The `local` provider can be disabled with the [`DISABLE_IDP_LOCAL`](/docs/reference/flags/disable_idp_local/) feature flag.
- The `ldap` provider's inclusion and/or appearance on the UI'slogin page can be configured in the UI settings.

**Settings Example**

```yaml title="morio-settings.yaml"
iam: 
  providers:
    apikey:
      provider: apikey
      id: apikey
      label: API Key
    mrt: 
    local:
      provider: local
      id: local
      label: Morio Account
    ad: # You can choose the ID of the ldap provider instance
     provider: ldap # You cannot choose this, it must always be `ldap`
     id: ad # Must match the ID chosen
     about: This is your Active Directory account, the same you use to login to your computer.
     server:
       url: "ldaps://dc1.tokyo.morio.it
       bindDN: "CN=morio-ldap,OU=Users,DC=tokyo,DC=morio,DC=it",
       bindCredentials: "{{{ AD_PASSWORD }}}",
       searchBase: "OU=Users-EU,DC=tokyo,DC=morio,DC=it",
       searchFilter: "(&(objectClass=user)(samaccountname={{username}}))"
     username_field: samaccountname
     label: Active Directory
     rbac:
       user:
         attribute: samaccountname
         regex: .
       engineer:
         attribute: samaccountname
         regex: "^(?:jdecock|stellene|lbazille)$"
     verify_certificate: true,
  ui:
    visibility:
      ad: ok
      apikey: icon
      local: icon
      mrt: icon
    order: 
      - ad
      - apikey
      - local
      - mrt
  tokens:
    secrets:
      AD_PASSWORD: Your password for the bindDN account here
```

