---
title: build:dev
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `build:dev` _run script_ builds container images for local development.

Run `npm run build:dev` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run build:api && \
npm run build:core && \
npm run build:ui && \
npm run build:dbuilder
```

In other words `npm run build:dev` is an umbrella script that runs the following run scripts:

- [build:api](/docs/reference/contributors/monorepo/run-scripts/build-api)
- [build:core](/docs/reference/contributors/monorepo/run-scripts/build-core)
- [build:ui](/docs/reference/contributors/monorepo/run-scripts/build-ui)
- [build:dbuilder](/docs/reference/contributors/monorepo/run-scripts/build-dbuilder)

<DockerBuildEnvDiffs />
