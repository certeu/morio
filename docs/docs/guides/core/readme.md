---
title: Understanding Morio Core
---

Morio's [core service](/docs/reference/services/core) sits at the heart of Morio and is
one of its most crucial services.

When you are responsible for a Morio deployment, you might benefit from a high-level
understanding of what is happening inside core, without having to dive into [its
source code](https://github.com/certeu/morio/tree/develop/core).

In this guide, we will walk you through the most common scenarios core can be
in, and illustrate the high-level flow of events with flowcharts.

The following flows are documented:

- [Initial startup](/docs/guides/core/startup)
- [The `reconfigure()` method](/docs/guides/core/startup)
- [The `startMorio()` method](/docs/guides/core/startmorio)
- [The `beforeAll()` lifecycle hook](/docs/guides/core/beforeall)
- [The `ensureService()` method](/docs/guides/core/ensureservice)

