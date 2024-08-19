--- 
title: ci:build.moriod.deb
---

The `ci:build.moriod.deb` _run script_ builds a Debian package (.deb) for
_moriod_, the morio distribution.

Run `npm run ci:build.moriod.deb` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/ci-build-moriod-deb.sh
```

## Publish the built package

This script takes an optional parameter `publish` that will publish the newly
built .deb package on
[packagecloud.io/morio/debian-12](https://packagecloud.io/morio/debian-12):

```sh title="Terminal"
npm run ci:build.moriod.deb publish
```

To make this work, the following environment variables should be available:

| Name | Description |
| ----:| ----------- |
| `PACKAGECLOUD_TOKEN` | The token to access the packagecloud.io API ([docs](https://packagecloud.io/docs/api#api_tokens)) |

