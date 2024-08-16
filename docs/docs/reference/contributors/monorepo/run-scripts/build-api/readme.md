--- 
title: build:api
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `build:api` _run script_ builds a container image for the _api service_
that can be used for local development.

Run `npm run build:api` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/build-container.sh api
```

<DockerBuildEnvDiffs />

