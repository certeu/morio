---
title: 'Morio Settings: preseed'
sidebar_label: preseed
toc_max_heading_level: 6
---

The `preseed` settings hold information to _preseed_ Morio. It is
<Label>optional</Label> unless you want to use preseeding.

The general principle is that it allows you to instruct Morio to collect
information from a variety of sources at initial startup (or when _reseeding_)
and use that information elsewhere.

The _various sources_ currently supported are: a URL, the GitLab or GitHub API,
and any git repository that can be cloned over HTTPS.

Whether you are running a _standalone node_ or several _broker nodes_ or
_flanking nodes_, the `cluster` settings hold this information.

## `preseed.git`

<Label>Optional</Label>
This defines one or more git repositories that Morio should clone locally so their contents can be re-used.

### `preseed.git.[repo-id]`

<Label style="danger">Mandatory</Label>
When defining a git repository to clone, you must give it an `id`.
In practice, we utilize the key under the `preseed.git` settings as the `id`.

Going forward, we will use `repo` as the example `id`.

#### `preseed.git.[repo-id].url`

<Label style="danger">Mandatory</Label> The URL to clone the repository over HTTPS.

```yaml
preseed:
  git:
    repo:
      url: 'https://github.com/certeu/morio-settings.git'
```

<Note compact>Morio does not support cloning over SSH</Note>

#### `preseed.git.[repo-id].ref`

<Label>Optional</Label> The `ref` to use when cloning the repository.
If not specified, the default branch of the repository will be used.
When specified, you can use a branch name, a tag, or even a commit reference.

```yaml
preseed:
  git:
    repo:
      ref: production
```

#### `preseed.git.[repo-id].user`

<Label>Optional</Label> The username to use for authentication when cloning
the repository.

```yaml
preseed:
  git:
    repo:
      user: bot
```

<Note compact>This will only take effect when `token` is also set</Note>

#### `preseed.git.[repo-id].token`

<Label>Optional</Label> The access token (password) to use for authentication when cloning
the repository.

<Tabs>
  <TabItem value="a" label="Using inline credentials" default>

```yaml
preseed:
  git:
    repo:
      token: 'Use this only for the initial preseeding'
```

</TabItem>
<TabItem value="b" label="Using a secret reference">

```yaml
preseed:
  git:
    repo:
      token: '{{ GITHUB_TOKEN }}'
```

</TabItem>
<TabItem value="c" label="Using a vault reference">

```yaml
preseed:
  git:
    repo:
      token:
        vault: 'morio/prod:GITHUB_TOKEN'
```

</TabItem>
</Tabs>

<Note compact>This will only take effect when `user` is also set</Note>

```yaml
preseed:
  git:
    repo:
      user: bot
```

## `preseed.base`

<Label style="danger">mandatory</Label>
This defines how to load the base settings file for Morio.
Both JSON or YAML is supported.

<Tabs>
  <TabItem value="a" label="A simple URL" default>

The simplest way is to use a string that points to a URL from which to load the base settings:

```yaml
preseed:
  base: 'https://github.com/certeu/morio-settings/blob/main/production/base-settings.yaml'
```

</TabItem>
<TabItem value="b" label="Reference to a git repository">

If you have defined git repositories under `preseed.git` you can refer to file in these repositories using this syntax:

```
git:path/to/file@id
```

Example:

```yaml
preseed:
  base: 'git:main/production/base-settings.yaml@repo'
```

</TabItem>
</Tabs>

### `preseed.base.url`

<Label>optional</Label>
For more control, you can set the `url` key to the URL, and add a `headers`
object to set the request headers. This allows you to configure any
authentication, as long as it works in a single request (like Basic, or
Bearer), rather than requiring a callback (like OIDC).

```yaml
preseed:
  base:
    url: 'https://github.com/certeu/morio-settings/blob/main/production/base-settings.yaml'
    headers:
      - authorization: 'Bearer my-super-secret-token-here'
```

### `preseed.base.github`

<Label>optional</Label>
To load data from the GitHub API, you can setup the `github` key.

#### `preseed.base.github.url`

<Label>optional</Label>
The (base) URL of the GitHub API. Defaults to `https://api.github.com` but can be changed for self-hosted GitHub.

```yaml
preseed:
  base:
    github:
      url: 'https://api.github.com'
```

#### `preseed.base.github.owner`

<Label style="danger">mandatory</Label>
The owner (user or organisation) of the repository.

```yaml
preseed:
  base:
    github:
      owner: certeu
```

#### `preseed.base.github.repo`

<Label style="danger">mandatory</Label>
The repository name

```yaml
preseed:
  base:
    github:
      repo: morio-settings
```

#### `preseed.base.github.file_path`

<Label style="danger">mandatory</Label>
The relative path inside the repository to the file to load as base settings.

```yaml
preseed:
  base:
    github:
      file_path: settings/production.yaml
```

#### `preseed.base.github.token`

<Label style="danger">mandatory</Label>
The GitHub (personal) access token to use for authentication to the GitHub API.

<Tabs>
  <TabItem value="a" label="Using inline credentials" default>

```yaml
preseed:
  base:
    github:
      token: 'Use this only for the initial preseeding'
```

</TabItem>
<TabItem value="b" label="Using a secret reference">

```yaml
preseed:
  base:
    github:
      token: '{{ GITHUB_TOKEN }}'
```

</TabItem>
<TabItem value="c" label="Using a vault reference">

```yaml
preseed:
  base:
    github:
      token:
        vault: 'morio/prod:GITHUB_TOKEN'
```

</TabItem>
</Tabs>

#### `preseed.base.github.ref`

<Label>Optional</Label> The `ref` to load the file contents from.
If not specified, the default branch of the repository will be used.
When specified, you can use a branch name, a tag, or even a commit reference.

```yaml
preseed:
  base:
    github:
      ref: production
```

### `preseed.base.gitlab`

<Label>optional</Label>
To load data from the GitLab API, you can setup the `gitlab` key.

#### `preseed.base.gitlab.url`

<Label>optional</Label>
The (base) URL of the GitLab instance. Defaults to `https://gitlab.com` but can be changed for self-hosted GitLab.

```yaml
preseed:
  base:
    gitlab:
      url: 'https://gitlab.morio.it'
```

#### `preseed.base.gitlab.project_id`

<Label style="danger">mandatory</Label>
The (numeric) `project_id` of the GitLab project.

```yaml
preseed:
  base:
    github:
      project_id: 61397500
```

<Tip compact>
You can find this under **Settings** → **General** on your repository page in the GitLab UI.
</Tip>

#### `preseed.base.gitlab.file_path`

<Label style="danger">mandatory</Label>
The relative path inside the repository to the file to load as base settings.

```yaml
preseed:
  base:
    gitlab:
      file_path: settings/production.yaml
```

#### `preseed.base.gitlab.token`

<Label style="danger">mandatory</Label>
The GitLab access token to use for authentication to the GitLab API.

<Tabs>
  <TabItem value="a" label="Using inline credentials" default>

```yaml
preseed:
  base:
    gitlab:
      token: 'Use this only for the initial preseeding'
```

</TabItem>
<TabItem value="b" label="Using a secret reference">

```yaml
preseed:
  base:
    gitlab:
      token: '{{ GITLAB_TOKEN }}'
```

</TabItem>
<TabItem value="c" label="Using a vault reference">

```yaml
preseed:
  base:
    gitlab:
      token:
        vault: 'morio/prod:GITLAB_TOKEN'
```

</TabItem>
</Tabs>

#### `preseed.base.gitlab.ref`

<Label>Optional</Label> The `ref` to load the file contents from.
If not specified, the default branch of the repository will be used.
When specified, you can use a branch name, a tag, or even a commit reference.

```yaml
preseed:
  base:
    gitlab:
      ref: production
```

## `preseed.overlays`

<Label>Optional</Label>
In addition to preseeding a base settings file (via the `preseed.base` setting)
you can apply one or more _overlays_ to these base settings.
This allows you to store your settings in a modular way.

<Tip>

<!-- Using HTML keeps the title out of the TOC -->
<h3 id="preseed-guide">Learn more about preseeding and overlays</h3>

For all details about preseeding, refer to the [Preseeding Guide](/docs/guides/settings/preseed).

</Tip>

### When `preseed.overlays` is a string

<Tabs>
  <TabItem value="a" label="Simple URL" default>

Use this to load a file from a URL.
Only use this if you only have 1 overlay to load.

```yaml
preseed:
  overlays: 'https://gitlab.com/morio/example-settings/-/blob/main/settings/overlays/idp-ad.yaml?ref_type=heads'
```

</TabItem>
<TabItem value="b" label="A git file reference">

Use this to load a file from a cloned git repository.
Only use this if you only have 1 overlay to load.

```yaml
preseed:
  overlays: 'git:settings/production.yaml@repo'
```

</TabItem>
<TabItem value="c" label="A git glob pattern">

Use this to load files from a cloned git repository that match a given [glob
pattern](<https://en.wikipedia.org/wiki/Glob_(programming)>).

```yaml
preseed:
  overlays: 'git:settings/production/overlays/*.yaml@repo'
```

</TabItem>
</Tabs>

### When `preseed.overlays` is an array

When `preseed.overlays` holds an array, you have more options. When an
elelent in the array is a string, it supports all the options [listed
above](/docs/reference/settings/preseed/#when-preseedoverlays-is-a-string).

In addition, for each element you have the following additional options:

<Tabs>
  <TabItem value="a" label="GitHub object" default>

Use this to load a file from the GitHub API, just like [you can do with the base file](#preseedbasegithub).

```yaml
preseed:
  overlays:
    - github:
        owner: 'certeu'
        repo: 'morio-settings'
        file_path: overlays/example.yaml
        user: '{{ GITHUB_USER }}'
        token: '{{ GITHUB_TOKEN }}'
```

</TabItem>
<TabItem value="b" label="GitHub reference">

If you have used a GitHub API request to load your base settings, you can re-use the same settings for an overlay using this syntax:

```
file_path@github
```

Example:

```yaml
preseed:
  overlays: 'settings/production.yaml@github'
```

</TabItem>
  <TabItem value="a2" label="GitLab object" default>

Use this to load a file from the GitLab API, just like [you can do with the base file](#preseedbasegitlab).

```yaml
preseed:
  overlays:
    - gitlab:
        project_id: 61397500
        file_path: overlays/example.yaml
        user: '{{ GITLAB_USER }}'
        token: '{{ GITLAB_TOKEN }}'
```

</TabItem>
<TabItem value="b2" label="GitLab reference">

If you have used a GitLab API request to load your base settings, you can re-use the same settings for an overlay using this syntax:

```
file_path@gitlab
```

Example:

```yaml
preseed:
  overlays: 'settings/production.yaml@gitlab'
```

</TabItem>
</Tabs>
