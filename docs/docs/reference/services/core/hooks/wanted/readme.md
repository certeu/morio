---
title: wanted
---

The `wanted` lifecycle hook is called at the start of [Core's `ensureService()`
method](/docs/guides/core/ensureservice/) to determine whether a service is
_wanted_.

For example, this how how many services disable themselves when Morio is in
[ephemeral state](/docs/reference/terminology/ephemeral-state/).

