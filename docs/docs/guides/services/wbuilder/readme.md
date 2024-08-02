---
title: WBuilder Service Guide
tags:
  - wbuilder
---

The **Morio Windows Builder Service** (rbuilder) is an on-demand service that builds
Morio client packages for the Windows platform.

As an on-demand service, it is not running all the time, instead it is started
by [the core service](/docs/guides/services/core) whenever a Windows client
package needs to be built.

<Fixme>This service is planned, but not implemented yet</Fixme>

## WBuilder service responsibilities

The wbuilder service is present on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Building Morio client packages for Windows

The wbuilder service has one job and one job only: Building client packages
for Windows systems.

