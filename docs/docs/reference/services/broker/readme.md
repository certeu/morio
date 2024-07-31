---
title: Broker
tags:
  - broker
---

The `broker` service is the engine that powers Morio's streaming backbone.

This service utilizes [RedPanda](https://redpanda.com/), a streaming data
platform that is provides Kafka-compatible APIs, without the complexity  of
running Kafka in production.

<Note>
This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/)
</Note>

