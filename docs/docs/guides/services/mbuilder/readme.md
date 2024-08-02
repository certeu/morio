---
title: MBuilder Service Guide
tags:
  - mbuilder
---

The **Morio Mac Builder Service** (rbuilder) is an on-demand service that builds
Morio client packages for the Mac platform.

As an on-demand service, it is not running all the time, instead it is started
by [the core service](/docs/guides/services/core) whenever a Mac client
package needs to be built.

<Fixme>This service is planned, but not implemented yet</Fixme>

## MBuilder service responsibilities

The mbuilder service is present on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Building Morio client packages for Mac

The mbuilder service has one job and one job only: Building client packages
for Mac systems.

