--- 
title: docker:build.moriod.deb
---

The `docker:build.moriod.deb` _run script_ builds a Debian package (.deb) 
for _moriod_, the morio distribution.

Run `npm run docker:build.moriod.deb` in the _monorepo_ root to trigger this script.

Unlike [the `ci:build.moriod.deb` run
script](/docs/reference/contributors/monorepo/run-scripts/ci-build-moriod-deb),
this script will launch a Debian 12 container and run inside of it.  In other
words, you can use this run script to the build the .deb package locally on a
non-Debian Linux system.

Under the hood, this will run:

```sh title="Terminal"
/scripts/docker-build-moriod-deb.sh
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

