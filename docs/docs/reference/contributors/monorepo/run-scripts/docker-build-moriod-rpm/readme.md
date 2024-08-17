--- 
title: docker:build.moriod.rpm
---

The `docker:build.moriod.rpm` _run script_ builds a RedHat package (.rpm) 
for _moriod_, the morio distribution.

Run `npm run docker:build.moriod.rpm` in the _monorepo_ root to trigger this script.

Unlike [the `ci:build.moriod.rpm` run
script](/docs/reference/contributors/monorepo/run-scripts/ci-build-moriod-rpm),
this script will launch a RockyLinux 8 container and run inside of it. In other
words, you can use this run script to the build the .rpm package locally on a
non-RedHat Linux system.

Under the hood, this will run:

```sh title="Terminal"
/scripts/docker-build-moriod-rpm.sh
```

## Publish the built package

This script takes an optional parameter `publish` that will publish the newly
built .rpm package on
[packagecloud.io/morio/rocky-9](https://packagecloud.io/morio/rocky-9):

```sh title="Terminal"
npm run ci:build.moriod.rpm publish
```

To make this work, the following environment variables should be available:

| Name | Description |
| ----:| ----------- |
| `PACKAGECLOUD_TOKEN` | The token to access the packagecloud.io API ([docs](https://packagecloud.io/docs/api#api_tokens)) |

