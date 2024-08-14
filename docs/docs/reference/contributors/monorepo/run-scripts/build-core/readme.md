--- 
title: build:core
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `build:core` _run script_ builds a container image for the _core service_
that can be used for local development.

Run `npm run build:core` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/build-container.sh core
```

<DockerBuildEnvDiffs />
