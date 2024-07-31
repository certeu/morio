---
title: postStart
---

The `postStart` lifecycle hook is called after a container/service is started.

For example, the [broker service](/docs/reference/services/broker/) will use
the `postStart` lifecycle hook to create topics in the `postStart` hook as this
needs to happen as soon as possible, yet after the broker is up and running.

