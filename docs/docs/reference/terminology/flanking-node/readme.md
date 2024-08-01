---
title: Flanking Node
---

A __flanking node__ is any Morio node that does not provide [the broker
service](/docs/guides/services/broker), but instead runs flanking services..

A node in a Morio deployment can have two different roles, broker node, or
[flanking node](/docs/reference/terminology/flanking-node).  Most services need
to run on a broker node because they are part of a distributed system.

However, services that instead are a client of the broker service  -- either as
a consumer, a producer, or both -- can run on one or more different nodes,
which we call flanking nodes.

