---
title: Morio Settings
sidebar_label: Settings
---

Morio is configured with a single settings object that supports the following top-level keys:

<SubPages />

Click on any of them to learn more about those specific settings, or consult
the full `settings.reference.yaml` example below:

```yaml title="settings.reference.yaml"
########################     Morio Settings Example     ########################
#                            _ _ _  ___  _ _  _  ___
#                           | ' ' |/ . \| '_/| |/ . \
#                           |_|_|_|\___/|_|  |_|\___/
#
# This is an example documenting all settings with comments.


########################            metadata            ########################
# This has no effect on morio, but can include it without getting schema errors

metadata:
  version: 463ed67c143b3c19d776a4047ebf00bd0347fa14
  comment: Added new identity provider


########################            cluster             ########################
# Describes your morio deployment, also used when there is only 1 node.

cluster:
  # Name can be anything you want, within reason
  name: Morio Example Cluster

  # This holds a list of (FQDNs of) broker nodes
  broker_nodes:
    - broker1.example.morio.it
    - broker2.example.morio.it
    - broker3.example.morio.it

  # This holds a list of (FQDNs of) flanking nodes
  flanking_nodes:
    - cache.example.morio.it
    - watcher.example.morio.it

  # This should be a round-robin DNS records for all broker nodes
  fqdn: example-cluster.morio.it


########################          connector             ########################
# Settings for the connector service (logstash)

connector: FIXME


########################             iam               ########################
# Settings for IAM (identity and access management)

iam:

  # An object holding the config for the various identity providers
  providers:

    ###  LDAP Provider  ###
    # Active Directory example
    # Note that 'ad' is just an ID, it can be different, and you can add multiple LDAP providers with their own ID
    ad:
      # The identity provider hanbling auth (in this case, ldap)
      provider: ldap
      # Label to be shown in the UI
      label: Active Directory
      # A description that will be shown to the user (in the UI)
      about: This is your Active Directory account, the same you use to login to your computer.
      # Which field to match the username against
      username_field: samaccountname
      # Service configuration
      server:
        # The URL of the LDAP server to bind to
        url: "ldaps://dc1.tokyo.morio.it
        # The DN to bind with
        bindDN: "CN=morio-ldap,OU=Users,DC=tokyo,DC=morio,DC=it",
        # The credentials for the bindDN (note that we are using a SECRET here)
        bindCredentials: "{{{ AD_PASSWORD }}}",
        # The search base to find the user accounts of people trying to authenticate
        searchBase: "OU=Users-EU,DC=tokyo,DC=morio,DC=it",
        # Search filter
        searchFilter: "(&(objectClass=user)(samaccountname={{username}}))"
      # Verify TLS certificate
      verify_certificate: true
      # (signing) Certificates to trust
      trust_certificate: | -
        -----BEGIN CERTIFICATE-----
        MIIDuDCCA1+gAwIBAgIRAJN/aaQr8ES0EUhWOOVjJAswCgYIKoZIzj0EAwIwOzEL
        MAkGA1UEBhMCVVMxHjAcBgNVBAoTFUdvb2dsZSBUcnVzdCBTZXJ2aWNlczEMMAoG
        A1UEAxMDV0UxMB4XDTI0MDcxNzA1NTU1OFoXDTI0MTAxNTA1NTU1N1owHDEaMBgG
        A1UEAxMRY2h1cmNob2ZzYXRhbi5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
        AATWtGh7OwX4SpUr0Dw+LS7+NxsNX0zp03KFbJ2MzxwYM5/J1ueCyW9hg04E1SX/
        XKhSgRkkoJbzUQBp56iU0KDKo4ICYTCCAl0wDgYDVR0PAQH/BAQDAgeAMBMGA1Ud
        JQQMMAoGCCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFHSwWMBYu+P7
        dMp5leya4wPv2Bz9MB8GA1UdIwQYMBaAFJB3kjVnxP+ozKnme9mAeXvMk/k4MF4G
        CCsGAQUFBwEBBFIwUDAnBggrBgEFBQcwAYYbaHR0cDovL28ucGtpLmdvb2cvcy93
        ZTEvazM4MCUGCCsGAQUFBzAChhlodHRwOi8vaS5wa2kuZ29vZy93ZTEuY3J0MDEG
        A1UdEQQqMCiCEWNodXJjaG9mc2F0YW4uY29tghMqLmNodXJjaG9mc2F0YW4uY29t
        MBMGA1UdIAQMMAowCAYGZ4EMAQIBMDYGA1UdHwQvMC0wK6ApoCeGJWh0dHA6Ly9j
        LnBraS5nb29nL3dlMS83aWZSV2dRdm1PSS5jcmwwggEGBgorBgEEAdZ5AgQCBIH3
        BIH0APIAdwBIsONr2qZHNA/lagL6nTDrHFIBy1bdLIHZu7+rOdiEcwAAAZC/efRi
        AAAEAwBIMEYCIQDZpGEfuacm+pPGCh0JOt2MSbpCmm40LqRl6/DrKlUnPAIhANlg
        iFmsYYR8VOYX3itNt3Kr3ymFqtJ+JGzExUNrB2USAHcA7s3QZNXbGs7FXLedtM0T
        ojKHRny87N7DUUhZRnEftZsAAAGQv3n0PAAABAMASDBGAiEAyZrb7W3bZ4ygbZ/U
        hj//EsIHeCWEzdrt4lIPpo+Uqj4CIQCqm0mKVPGLTK75Xrxs8O2oLjwlScAhmRF7
        h8TGeVPC2jAKBggqhkjOPQQDAgNHADBEAiAxuq5mtMxr/OHAxouHWRLRNZww4RMM
        U08Mwzye8rSMGAIgNjb/3nu8PfOoHyANU7jxpcB9xvgfyyJasFfCX0wJoAY=
        -----END CERTIFICATE-----
      # Access control configuration
      # Available roles are: user, manager, operator, engineer, root
      rbac:
        # Assign the 'user' role when
        user:
          # The 'samaccountname' field matches
          attribute: samaccountname
          # Against this regex (this matches everything)
          regex: .
        # Assign the 'engineer' role when
        engineer:
          # The 'samaccountname' field matches
          attribute: samaccountname
          # Against this regex (this matches 'mario' or 'luigi')
          regex: "^(?:mario|luigi)$"


    ###  API Key Provider  ###
    # For this provider, you must use 'apikey' as ID and you can only have 1
    apikey:
      # The identity provider hanbling auth (in this case, apikey)
      provider: apikey
      # Label to be shown in the UI
      # (note that API keys are not typically used for UI-based logins, but you can if you want to)
      label: API Key
      # A description that will be shown to the user (in the UI)
      # (note that API keys are not typically used for UI-based logins, but you can if you want to)
      about: This allows you to test your Morio API Key


    ###  Local Provider  ###
    # For this provider, you must use 'local' as ID and you can only have 1
    local:
      # The identity provider hanbling auth (in this case, local)
      provider: local
      # Label to be shown in the UI
      label: Morio Account
      # A description that will be shown to the user (in the UI)
      about: Sign in with your Morio account


    ###  MRT Provider  ###
    # For this provider, you must use 'mrt' as ID, you can only have 1, and it takes no settings
    mrt:


  # An object that controls how the various providers or shown in the UI
  ui:
    visibility:
      # Anything but 'icon' will include the provider on the login form
      ad: ok
      # Using 'icon' will hide the provider behind a 'lock' icon
      apikey: icon
      local: icon
      mrt: icon

    # This controls the order in which providers are displayed
    order:
      - ad
      - apikey
      - local
      - mrt


########################           preseed              ########################
# Settings for preseeding the configuration

preseed:

  # Use the 'git' key to define git repositories that should be cloned by Morio
  # You can then reference file from these repositories in your preseed settings
  # Note that this must be an array, even if you have only 1 repository to clone
  git:

    # A GitHub example
    github:
      # This is the 'clone via https' URL
      url: https://github.com/certeu/morio-test-data.git

      # The ref to fetch, if not specified, will use the default branch
      # This behaves like 'git clone' so you can specify a branch or even a tag or commit
      ref: main

      # A user for authentication. Will only be used if token is also set.
      user: "{{ GITHUB_USER }}",

      # A token (password) for authentication. Will only be used if user is also set.
      token: "{{ GITHUB_TOKEN }}"

    # A GitLab example
    gitlab
      # This is the 'clone via https' URL
      url: https://gitlab.com/morio/test-data.git

      # The ref to fetch, if not specified, will use the default branch
      # This behaves like 'git clone' so you can specify a branch or even a tag or commit
      ref: main

      # A user for authentication. Will only be used if token is also set.
      user: "{{ GITLAB_USER }}",

      # A token (password) for authentication. Will only be used if user is also set.
      token: "{{ GITLAB_TOKEN }}"


  # The 'base' key holds info for the base settings file to load
  # This supports various ways to load the base file, refer to
  # /docs/reference/settings/preseed
  base: "git:morio/settings/example.yaml@github"

  # The 'overlays' key holds info for settings overlay files to load
  # This supports various ways to load the base file, refer to
  # /docs/reference/settings/preseed
  overlay: "git:morio/setttings/overlays/exampe.*.yaml@gitlab"


########################            tokens              ########################
# This is where you define flags, secrets, and vars

tokens:

  # Feature flags
  flags:

    # Disables the apikey identity provider
    DISABLE_IDP_APIKEY: false

    # Disables the ldap identity provider
    DISABLE_IDP_LDAP: false

    # Disables the local identity provider
    DISABLE_IDP_LOCAL: false

    # Disables the mrt identity provider
    DISABLE_IDP_MRT: false

    # Disabled the UI service and runs Morio in headless mode
    HEADLESS_MORIO: false


  # Secrets
  secrets:

    # You can specify a secret in clear text, it will be encrypted going forward
    NEW_SECRET: example

    # The settings will be stored with all secrets encrypted
    EXISTING _SECRET: FIXME

    # Only if a secret references Vault will it not be encrypted:
    AD_PASSWORD:
      vault: morio/example:AD_PASSWORD

  # Variable. Like secrets, but not encrypted
  vars:

    # These are key/value pairs that you can reference in your settings to keep them DRY
    MY_VAR: examplek


########################            vault               ########################
# Settings for integration with Hashicorp Vault

vault:
  # URL to access Vault
  url: https://vault.example.morio.it

  # Set this to false to not verify the certificate
  verify_certificate: true

  # Role to use. Default is 'morio'
  role: morio

  # Path to the JWT authentication method. Default is 'morio'
  jwt_auth_path: morio

  # Path to the KV engine. Default is 'secret'
  # Note that we only support the KV v2 secrets engine.
  kv_path: secret


########################           watcher              ########################
# Settings for the watcher service (heartbeat)

watcher:  FIXME

```
