---
title: Mbuilder
tags:
  - mbuilder
---

The `mbuilder` service provides on-demand builds for MacOS (pkg) client packages.

This service is not always running, but rather started on-demand by [the core
service](/docs/reference/services/core) when a `.pkg` client package needs to
be built.

<Note>
This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/).
</Note>

<Scode>
Source code for this service resides in [the `builders/mbuilder` folder of our monorepo](https://github.com/certeu/morio/tree/develop/builders/mbuilder).
</Scode>


