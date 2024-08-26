---
title: Flanking Node
tags:
  - flanking
---

A **flanking node** is any Morio node that does not provide [the broker
service](/docs/guides/services/broker), but instead runs a
_flanking service_.

A node in a Morio deployment can have two different roles, _broker node_, or
_flanking node_. Most services need
to run on a _broker node_ because they are part of a distributed system.

However, services that instead are a client of the broker service -- either as
a consumer, a producer, or both -- can run on one or more different nodes,
which we call flanking nodes.

<Note title="Flanking service">
Refer to _flanking service_ for
details of what it means to be a flanking service.
</Note>
