---
title: preStart
---

The `preStart` lifecycle hook is called before a container/service is started.

For example, the [connector service](/docs/reference/services/connector/) will
use the `preStart` hook to verify the pipeline configurations on disk are in
sync with the Morio's high-level settings.

