---
title: DBuilder Service Guide
tags:
  - dbuilder
---

The **Morio Debian Builder Service** (dbuilder) is an on-demand service that builds
Morio client packages in `.deb` format, the package format used by 
Debian-based Linux distributions.

As an on-demand service, it is not running all the time, instead it is started
by [the core service](/docs/guides/services/core) whenever a `.deb` client
package needs to be built.

## DBuilder service responsibilities

The dbuilder service is present on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Building .deb Morio client packages

The dbuilder service has one job and one job only: Building client packages
for Debian-based Linux distributions.

