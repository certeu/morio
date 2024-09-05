---
title: 'Morio Settings: iam'
sidebar_label: iam
toc_max_heading_level: 6
---

The `iam` settings control **identity and access management** in Morio.
Specifically, they allow you to [configure
_identity providers_](#iamproviders) and control [how they are
displayed in the UI](#iamui).

<Note>

The `iam` settings only apply to **HTTP-based access to Morio**.
Access to Morio's Kafka API is always authenticated by _mTLS_.

</Note>

## `iam.providers`

<Label>Optional</Label>
The `iam.providers` key holds one or more _identity providers_ that are enabled
on your Morio deployment.

This key holds and object where the properties of the object are the `id` of
the different identity providers.
There are two two types:

- An identity provider that only can be instantiated once will have a
  predefined key. The `apikey` and `local` IDPs fall into this category.
- An identity provider that can be instantiated more than once will have a key
  that can be freely chosen and will serve as the IDP's `id`. The `ldap` IDP
  falls into this category.

<Warning>

<!-- toc-heading: false -->

### The Morio root token _just works_

The [Morio root token provider (mrt)](/docs/guides/idps/#mrt) is enabled by
default and does not require configuration. In other words, authenticating
with the _Morio root token_ just works, even if not providers are set up.

You can configure the inclusion or appearance of the `mrt` provider on the UI’s
login page through [the `iam.ui` settings](#fixme), or disable it altogether
with [the `DISABLE_IDP_MRT` feature
flag](/docs/reference/flags/disable_idp_mrt/).

</Warning>

### `iam.providers.apikey`

<Label>Optional</Label> This configures [the `apikey` identity provider](/docs/guides/idps/#apikey).

#### `iam.providers.apikey.provider`

<Label style="danger">Mandatory</Label>
To enable the `apikey` identity provider, this **must** be set to `apikey`.

```yaml
iam:
  providers:
    apikey:
      provider: apikey
```

#### `iam.providers.apikey.label`

<Label>Optional</Label> This is a label that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    apikey:
      label: API Key
```

#### `iam.providers.apikey.about`

<Label>Optional</Label> This is a description that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    apikey:
      about: This allows you to test your Morio API Key
```

### `iam.providers.local`

<Label>Optional</Label> This configures [the `local` identity provider](/docs/guides/idps/#local).

#### `iam.providers.local.provider`

<Label style="danger">Mandatory</Label>
To enable the `local` identity provider, this **must** be set to `local`.

```yaml
iam:
  providers:
    local:
      provider: local
```

#### `iam.providers.local.label`

<Label>Optional</Label> This is a label that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    local:
      label: Morio Account
```

#### `iam.providers.local.about`

<Label>Optional</Label> This is a description that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    local:
      about: Log in with your Morio account
```

### `iam.providers[id]`

This creates and additional identity provider with a chosen `id`.
This allows you to set up multiple identity providers of this type.

### `iam.providers.[ldap-id]`

<Label>Optional</Label> This configures [an `ldap` identity provider](/docs/guides/idps/#ldap).

<Note>

We use `[ldap-id]` as a placeholder here. This is a freely chosen `id`, and we
will use `ad` as our examples because using this to authenticate against Active
Directory is a common use-case.

</Note>

#### `iam.providers.[ldap-id].provider`

<Label style="danger">Mandatory</Label>
To enable an `ldap` identity provider, this **must** be set to `ldap`.

```yaml
iam:
  providers:
    ad:
      provider: ldap
```

#### `iam.providers.[ldap-id].label`

<Label>Optional</Label> This is a label that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    ad:
      label: AD Account
```

#### `iam.providers.[ldap-id].about`

<Label>Optional</Label> This is a description that will be shown to the user in the _UI Service_.

```yaml
iam:
  providers:
    ad:
      about: This is your Active Directory account, the same you use to login to your computer.
```

#### `iam.providers.[ldap-id].username_field`

<Label style="danger">Mandatory</Label>
This sets the LDAP field that shall be used as the username.

```yaml
iam:
  providers:
    ad:
      username_field: samaccountname
```

#### `iam.providers.[ldap-id].trust_certificate`

<Label>Optional</Label>
Set this to a PEM-encoded certificate that should be trusted when connecting to
the LDAP server over TLS.

```yaml
iam:
  providers:
    ad:
      trust_certificate: | -
        -----BEGIN CERTIFICATE-----
        MIIDfjCCAwSgAwIBAgISAxT9oF2eiPOpmGj6Imea6R41MAoGCCqGSM49BAMDMDIx
        CzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJF
        NjAeFw0yNDA3MTcwNDAyMTNaFw0yNDEwMTUwNDAyMTJaMBMxETAPBgNVBAMTCG1v
        cmlvLml0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERficTiGhJRS5Pso7hOpM
        i2WLILmC3AdE/ztGs0XCIrHs7sSsj0shApL1G9/+bXTNuuB+LmbF3vLR92R8qrhT
        z6OCAhcwggITMA4GA1UdDwEB/wQEAwIHgDAdBgNVHSUEFjAUBggrBgEFBQcDAQYI
        KwYBBQUHAwIwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUMYu6mooQXgJ6RvxaAahr
        M0GIhFgwHwYDVR0jBBgwFoAUkydGmAOpUWiOmNbEQkjbI79YlNIwVQYIKwYBBQUH
        AQEESTBHMCEGCCsGAQUFBzABhhVodHRwOi8vZTYuby5sZW5jci5vcmcwIgYIKwYB
        BQUHMAKGFmh0dHA6Ly9lNi5pLmxlbmNyLm9yZy8wIQYDVR0RBBowGIIIbW9yaW8u
        aXSCDHd3dy5tb3Jpby5pdDATBgNVHSAEDDAKMAgGBmeBDAECATCCAQMGCisGAQQB
        1nkCBAIEgfQEgfEA7wB1AD8XS0/XIkdYlB1lHIS+DRLtkDd/H4Vq68G/KIXs+GRu
        AAABkL8RzlUAAAQDAEYwRAIgc1iJUySn/2LPWmmlM41XTtBHIxRf1ko90PEt+tSd
        fJMCIH1SXpmOh6NR4nPuqUAlXp5/9ktjH8F2E0yiqXGjYMhaAHYAdv+IPwq2+5VR
        wmHM9Ye6NLSkzbsp3GhCCp/mZ0xaOnQAAAGQvxHOiwAABAMARzBFAiACLbgSLlbv
        RAi36rsJsmtMHrxw9/G+uIT7OtP/zaG3CAIhAKtsVad4/fIdHTLAk4GtAxkaKj+a
        l2tL6EXSgHRMbrptMAoGCCqGSM49BAMDA2gAMGUCMDEpM51fn4T/GUI6LVvA0LRr
        b/DPCwXecIjIb43DO24pod5qKF+fL2xNr/wnaMxHKgIxAO7TTelusI229SmOkQFq
        sbupQw74yW6UK64tYLxu8sfRbx60OfpNtmIyDd9poHpSzQ==
        -----END CERTIFICATE-----
```

#### `iam.providers.[ldap-id].verify_certificate`

<Label>Optional</Label>
Set this to `false` to skip verification of the LDAP server's TLS certificate.

<Tip compact>

Rather than disable verification, set [the `trust_certificate`
setting](#iamprovidersldap-idtrust_certificate) instead.

</Tip>

<Tabs>
  <TabItem value="a" label="Default" default>

```yaml
iam:
  providers:
    ad:
      verify_certificate: true
```

</TabItem>
<TabItem value="b" label="Disable certificate verification">

```yaml
iam:
  providers:
    ad:
      verify_certificate: false
```

</TabItem>
</Tabs>

#### `iam.providers.[ldap-id].server`

<Label style="danger">Mandatory</Label>
This sets the LDAP server that will act as the authentication backend.

It requires settings to:

- Find the server: the `url` setting
- Do the initial bind: the `bindDN` and `bindCredentials` settings
- Search for the user who is trying to authenticate: the `searchBase` and `searchFilter` settings

##### `iam.providers.[ldap-id].server.url`

<Label style="danger">Mandatory</Label>
Set this to the URL that will be used to connect to the LDAP server, including the protocol.

```yaml
iam:
  providers:
    ad:
      server:
        url: "ldaps://dc1.tokyo.morio.it
```

<Tip>
While both `ldap://` and `ldaps://` are supported, you should really only use `ldaps://` for in production.
</Tip>

##### `iam.providers.[ldap-id].server.bindDN`

<Label style="danger">Mandatory</Label>
Set this to the distinguished name (DN) that should be used to bind to the LDAP server.

```yaml
iam:
  providers:
    ad:
      server:
        bindDN: "CN=morio-ldap,OU=Users,DC=tokyo,DC=morio,DC=it",
```

<Note>
LDAP servers typically do not allow an anonymous search.
So we need to bind to the LDAP server to be able to find the user.
This `bindDN` is the LDAP-equivalent of the username used for that initial bind.
You should probably create a dedicated service account for this that does not
have any privileges apart from looking up information.
</Note>

##### `iam.providers.[ldap-id].server.bindCredentials`

<Label style="danger">Mandatory</Label>
Set this to the distinguished name (DN) that should be used to bind to the LDAP server.

<Tabs>
  <TabItem value="a" label="Using inline credentials" default>

```yaml
iam:
  providers:
    ad:
      server:
        bindCredentials: 'this is not a good idea, use a secret or vault instead'
```

</TabItem>
<TabItem value="b" label="Using a secret reference">

```yaml
iam:
  providers:
    ad:
      server:
        bindCredentials: '{{ MORIO_AD_BIND_PASSWORD }}'
```

</TabItem>
<TabItem value="c" label="Using a vault reference">

```yaml
iam:
  providers:
    ad:
      server:
        bindCredentials:
          vault: 'morio/prod:MORIO_AD_BIND_PASSWORD'
```

</TabItem>
</Tabs>

##### `iam.providers.[ldap-id].server.searchBase`

<Label style="danger">Mandatory</Label>
Set this to the location in your LDAP structure where we should search for user accounts.

```yaml
iam:
  providers:
    ad:
      server:
        bindCredentials: "{{{ AD_PASSWORD }}}",
        searchBase: "OU=Users-EU,DC=tokyo,DC=morio,DC=it",
```

##### `iam.providers.[ldap-id].server.searchFilter`

<Label style="danger">Mandatory</Label>
Set this to an LDAP filter to further limit the scope of the search for matching user accounts.

```yaml
iam:
  providers:
    ad:
      server:
        bindCredentials: "{{{ AD_PASSWORD }}}",
        searchFilter: "(&(objectClass=user)(samaccountname={{username}}))"
```

#### `iam.providers.[ldap-id].rbac`

<Label style="danger">Mandatory</Label>
This controls role assignment to user accounts backed by an LDAP identity provider.

##### `iam.providers.[ldap-id].rbac.[role]`

<Label>Optional</Label>
There are 4 different roles that can be assigned: `user`, `manager`, `operator`, and `engineer`.
They govern Morio-specific permissions, with `engineer` having the highest and `user` the lowest access.

For each role, you can specify the attribute to match against, and either a
regular expression with the `regex` key, or an explicit list with the `list` key.
When the expression matches the attribute value, **or** it is included in the list,
that role will be assigned to the user.

This system applies to all identity providers, giving you a lot of flexbility
to define who gets what role(s).

<Note compact>We will use the `user` role in our examples below</Note>

###### `iam.providers.[ldap-id].rbac.[role].attribute`

<Label style="danger">Mandatory</Label>
This defines the attribute to match against to determine whether or not to assign the role.

```yaml
iam:
  providers:
    ad:
      rbac:
        user:
          attribute: samaccountname
```

###### `iam.providers.[ldap-id].rbac.[role].list`

<Label style="danger">Optional</Label>
This defines a list (an array) of values. If the attribute value is in the list, the role will be assigned.

```yaml
iam:
  providers:
    ad:
      rbac:
        user:
          list:
            - jdecock
            - lbazille
            - stellene
```

<Tip>

For higher-order roles, like `operator` or `engineer`, **we recommend defining
an explicit list**, rather than using a regular expression. This makes it
easier to see who has elevated access, as well as avoid issues with regular
expressions matching broader than intended.

</Tip>

###### `iam.providers.[ldap-id].rbac.[role].regex`

<Label style="danger">Optional</Label>
This defines the attribute to match against to determine whether or not to assign the role.

```yaml
iam:
  providers:
    ad:
      rbac:
        user:
          regex: .
```

<Note>

In the example above, the regex `.` matches anyrthing. So every user who can
successfully authenticate to LDAP will get the `user` role.

</Note>

## `iam.ui`

<Label>Optional</Label> insofar as the entire _UI Service_ is optional.

The `iam.ui` key holds details on how various identity providers should be
integrated in the _UI Service_ that provides web-based user interface.

### `iam.ui.visibility`

<Label style="danger">Mandatory</Label> for each identity provider `id` this controls the visibility on the login screen.

### `iam.ui.visibility.[provider-id]`

<Label style="danger">Mandatory</Label>
Set this to `icon` to hide the provider behind an icon. Set it to anything else to make it directly available.

```yaml
iam:
  ui:
    visibility:
      ad: ok
      local: ok
      mrt: icon
      apikey: icon
```

### `iam.ui.order`

<Label>Optional</Label>
This controls the order in which identity providers are shown on the login screen.

```yaml
iam:
  ui:
    order:
      - ad
      - apikey
      - local
      - mrt
```
