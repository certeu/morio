--- 
title: ci:build.core
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `ci:build.core` _run script_ builds a container image for the _core service_
that is intended to be used in production, or can be published as a new release.

Run `npm run ci:build.core` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/ci-build-container.sh core
```

## Publish the built image

This script takes an optional parameter `publish` that will publish the newly
built image on dockerhub:

```sh title="Terminal"
npm run ci:build.core publish
```

To make this work, the following environment variables should be available:

| Name | Description |
| ----:| ----------- |
| `DOCKER_USERNAME` | The username to authentication to [the Docker registry][dockerhub] |
| `DOCKER_PAT` | The (personal access) token to authentication to [the Docker registry][dockerhub] |


<DockerBuildEnvDiffs />

[dockerhub]: https://hub.docker.com/
