---
title: Flanking Node
---

A **flanking node** is any Morio node that does not provide [the broker
service](/docs/guides/services/broker), but instead runs on or
more [flanking services](/docs/reference/terminology/flanking-service).

A node in a Morio deployment can have two different roles, broker node, or
[flanking node](/docs/reference/terminology/flanking-node). Most services need
to run on a broker node because they are part of a distributed system.

However, services that instead are a client of the broker service -- either as
a consumer, a producer, or both -- can run on one or more different nodes,
which we call flanking nodes.

<Related>
Refer to [flanking service](/docs/reference/terminology/flanking-service) for
details of what it means to be a flanking service.
</Related>
