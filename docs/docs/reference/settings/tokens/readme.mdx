---
title: 'Morio Settings: tokens'
sidebar_label: tokens
---

The `tokens` settings hold various tokens. They come in three different flavours:

- `vars` are variables that you can use to keep your settings _DRY_
- `secrets` are sensitive variables that will be encrypted
- `flags` allows you to set [feature flags](/docs/reference/flags/)

All of them are <Label>optional</Label>.

## `tokens.vars`

<Label>Optional</Label>
Allows you to create variables that you can then re-use throughout your configuration.

To use them, use [mustache syntax](https://mustache.github.io/):

- Use double curly braces for default replacement: `"{{ MY_VAR }}"`
- Use triple curly braces to suppress HTML-escaping of the value: `"{{{ MY_HTML_VAR }}}"`

### `tokens.vars.[name]`

<Label>Optional</Label>
To create a variable, create a key under `tokens.vars` and give it a value.

```yaml
tokens:
  vars:
    ITS_ME: Morio
```

<Tip>It is a common practice to uppercase variables so they stand out in the settings.</Tip>

## `tokens.secrets`

<Label>Optional</Label>
Allows you to create sensitive variables (aka secrets) that you can then re-use
throughout your configuration.

Secrets behave exactly like variables, but have two important differences:

- They will be encrypted
- They support Morio's [Hashicarp Vault integration](/docs/guides/integrations/vault)

To use them, use [mustache syntax](https://mustache.github.io/):

- Use double curly braces for default replacement: `"{{ MY_VAR }}"`
- Use triple curly braces to suppress HTML-escaping of the value: `"{{{ MY_HTML_VAR }}}"`

### `tokens.secrets.[name]`

<Label>Optional</Label>
To create a secret, create a key under `tokens.secrets` and give it a value.

<Tabs>
  <TabItem value="a" label="Regular Secrets" default>

```yaml
tokens:
  secrets:
    NOBODY_CAN_KNOW_THIS: You really are quite cute
```

Morio will encrypt this value at rest so that it looks something like this:

```yaml
tokens:
  secrets:
    NOBODY_CAN_KNOW_THIS: FIXME
```

</TabItem>
<TabItem value="b" label="Hashicorp Vault">

To defer to [the Hashicarp Vault integration](/docs/guides/integrations/vault),
make your value an object with key `vault` and use the following syntax for its
value:

```
path_to_secrets:SECRET_NAME
```

Example:

```yaml
tokens:
  secrets:
    NOBODY_CAN_KNOW_THIS:
      vault: "path/to/secrets:NOBODY_CAN_KNOW_THIS
```

<Tip>

The name of the secret in Vault does not need to match the name of the secret in Morio.
But as it makes troubleshooting easier, we recommend making them match.

</Tip>

</TabItem>

</Tabs>

<Tip>It is a common practice to uppercase secrets so they stand out in the settings.</Tip>

## `tokens.flags`

<Label>Optional</Label>
Allows you to set Morio [feature flags](/docs/reference/flags).

### `tokens.flags.[flag]`

To set a feature flag, create a key under `tokens.flags` with the name of the feature flag.
Then give it the value you want.

```yaml
tokens:
  flags:
    DISABLE_IDP_MRT: true
```
