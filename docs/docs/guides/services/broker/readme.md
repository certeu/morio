---
title: Broker Service Guide
tags:
  - broker
---

The **Morio Broker Service** (broker) is the data backbone of Morio.
Under the hood, the broker is a RedPanda broker providing a Kafka-compatible
streaming data platform.

It is in many ways the most important service within Morio.

<Related>
If you would like to learn more than what is covered in this guide, 
please [refer to the RedPanda Documentation
](https://docs.redpanda.com/).
</Related>

## Broker service responsibilities

The broker service runs on every Morio `broker_node`, and handles the following
responsibilities:

### Streaming data

It should go without saying, but the broker service provides the streaming data backbone of Morio.
In practice, it provides a Kafka-compatible API that Morio clients connect to.

It does that without requiring Zookeeper or Kraft (as Kafka would) or running a
JVM, this fitting nicely into [our design goals](/docs/guides/goals).

### RedPanda Admin API

The broker also provides the [RedPanda Admin API](https://docs.redpanda.com/api/admin-api/).

This API is used internally by Morio as well as by [the console service](/docs/guides/services/console).

### RedPanda HTTP Proxy API

Another API provided by the broker service is the HTTP Proxy API.
This API allows ingesting data into the broker over HTTP, rather than the native Kafka protocol.

This API is also used internally by Morio.

### Cluster consensus

Finally, the broker service also provides Morio cluster consensus.
Consensus is a fundamental problem in fault-tolerant distributed systems.
Essemtially, whenever multiple servers have to agree on something, consensus
needs to be established.

Since Morio supports clustering, it also requires establishing consensus between cluster nodes.
However, because we like to [keep things simple](/docs/guides/goals) Morio does
not implement its own consensus algorithm. Instead, we piggy-back on the broker
which uses [the Raft Consensus
Algorithm](https://raft.github.io/) to establish consensus between broker
nodes.

As a result, the core service will defer to the broker service to determine
which node in the cluster is the leader, and them simply mark that node as
leader. After all, it does not matter who leads the cluster, it only matters that all
nodes agree, that there is consensus in other words.

As a result, clustering in Morio has a few constraints:

- You cannot run a Morio cluster without the broker service.<br />
  <small>This is a problem in name only because without a broker what's the point or running a Morio cluster?</small>
- A [flanking node](/docs/reference/terminology/flanking-node/) can never becomethe cluster leader.<br />
  <small>This is a good thing because flanking nodes are allowed to come and go as they please</small>
