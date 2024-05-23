---
title: Wbuilder
tags:
  - wbuilder
---

The `wbuilder` service provides on-demand builds for Windows (msi) client packages.

This service is not always running, but rather started on-demand by [the core
service](/docs/reference/services/core) when a `.msi` client package needs to
be built.

<Note>
This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/).
</Note>

<Scode>
Source code for this service resides in [the `builders/wbuilder` folder of our monorepo](https://github.com/certeu/morio/tree/develop/builders/wbuilder).
</Scode>


