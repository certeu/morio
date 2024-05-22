---
title: Core
---

The `core` service is responsible for resolving the high-level Morio settings
into a detailed configuration for all services, as well as orchestration of the
different services/containers.

<Note>
- This service __is available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/)
- This service is not exposed to users, it is internal to Morio.
</Note>

<Scode>
Source code for this service resides in [the `core` folder of our monorepo](https://github.com/certeu/morio/tree/develop/core).
</Scode>
