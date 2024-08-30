---
title: Flanking Service
tags:
  - flanking
---

A _flanking service_ is any service that can be deployed on a _flanking node_.  
A flanking node is a node running flanking services, so that creates a
circular argument.

In practice, flanking services are services leveraging native **Kafka stream
processing**.

To better understand this, we need to briefly unpack what separates a flanking
service from a non-flanking service.

## Flanking vs regular services

A _flanking service_ it needs to adhere to two criteria:

- The service is a client of a Morio service
- The service is not a dependency for/of other Morio services

When both conditions are met, the service can run as a flanking service, and
thus be deployed on a flanking node which can be scaled up or down at will.

Let's look at some examples to clarify this further.

### Flanking service example: The connector service

The [connector service](/docs/guides/services/connector) is responsible for
routing data from and to external systems.

To accomplish that, the service -- a Logstash instance -- will act as a client to the
broker service.
In the capacity of _consumer_ when reading data from the
Morio broker service, and in the capacity of _producer_ when writing data
to the broker service.

Apart from this, the connector service has no dependencies on other services.
Furthermore, other Morio services have no dependencies on the connector service.

This makes the service a _flanking service_. It can run on a [broker
node](/docs/reference/terminology/broker-node) -- as any service -- but it can
also run on a flanking node.

You might start out by running everything on a single node. Then, as you start
processing more data and adding more pipelines, you can spin up a new host,
install Morio on it, and join it as a flanking node.
Now, you can run your connector service on this flanking node instead.

Later, you might even add 2 more nodes and run 3 connector services in parallel
working together as a single consumer group.

This shows the flexibility of flanking services. They can run on any node and
you can move them around without having to worry about the implications of
resizing the cluster.

### Regular service example: The ui service

The [ui service](/docs/guides/services/ui) provides the Morio web-based user interface.
It's built as a so-called _composable web architecture_ where all its interactivity
is backend by [the api service](/docs/guides/services/api).

That makes it sound like a great candidate for a flanking service. After all,
it's just a client of the API service. Using the ui service is just a more
user-friendly way to talk to the api service.

However, the ui service relies on the proxy service for TLS termination,
enforcing authentication through middleware, and some other things.
So to deploy it, we'd also need to deploy the proxy service with it.

We could in principle manage all of these different combinations but that would
brush up against [our design goals](/docs/guides/goals) of keeping it as simple
as possible.

## Summary

Given the constraints outlines above, flanking services are without exception
services providing stream processing over the Kafka protocol. Their ability
to scale horizontally is provided partially by Morio handling the configuration
and deployment of the service, but also hinges on the Kafka-native abilities
such as consumer groups.

These stream processing services are also the most obvious candidates for
horizontal scaling as these services tend to consume much more compute and
memory resources than say, the ui service.
