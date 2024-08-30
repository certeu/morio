---
title: build:ui
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `build:ui` _run script_ builds a container image for the _ui service_
that can be used for local development.

Run `npm run build:ui` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/build-container.sh ui
```

<DockerBuildEnvDiffs />
