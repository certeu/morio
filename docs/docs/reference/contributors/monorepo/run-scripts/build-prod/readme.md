---
title: build:prod
---

import DockerBuildEnvDiffs from '@site/includes/docker-env-diffs.md'

The `build:prod` _run script_ builds container images for production.

Run `npm run build:prod` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run ci:build.api && \
npm run ci:build.core && \
npm run ci:build.ui && \
npm run ci:build.dbuilder
```

In other words `npm run build:prod` is an umbrella script that runs the following run scripts:

- [ci:build.api](/docs/reference/contributors/monorepo/run-scripts/ci-build-api)
- [ci:build.core](/docs/reference/contributors/monorepo/run-scripts/ci-build-core)
- [ci:build.ui](/docs/reference/contributors/monorepo/run-scripts/ci-build-ui)
- [ci:build.dbuilder](/docs/reference/contributors/monorepo/run-scripts/ci-build-dbuilder)

<DockerBuildEnvDiffs />
