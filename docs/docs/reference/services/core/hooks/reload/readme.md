---
title: reload
---

The `reload` lifecycle hook is called at the end of [Core's `ensureService()`
method](/docs/guides/core/ensureservice/).  
This marks the moment in time when the service configuration is completed.

For example, the [ca service](/docs/reference/services/broker/) will use
the reload the service.

