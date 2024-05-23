---
title: High-level design
---

On this page we will go over the high-level design of Morio, as well as cover
our design objectives, and outline why we made the choices we made.

## Executive Summary

Morio is an observability platform based on best-of-breed open source
technologies that is powerful, yet easy to deploy, manage, maintain, and
extend.

Anyone with sufficient expertise, time, and dedication can build a
state-of-the-art streaming data infrastructure out of the components we have
chosen. But with Morio you don't have to as it provides an appliance-like
experience where you can set up and configure the entire system through its web
UI or REST API.

Without being dismissive of our own efforts, the hard work in Morio is
done by off-the-shelf components with a proven track record.

What we hope to accomplish with Morio is to bring these technologies together
as a neat pre-made bundle so that everyone can enjoy them without the steep
learning curve.


## History

[CERT-EU](https://cert.europa.eu/) is the cybersecurity service for the
Institutions, Bodies, Agencies, and Offices of the European Union (EU Entities).
In this role, we are a _managed service provider_ to our constituents, with a
specific focus on cybersecurity.

Morio's origins lie in the evolution of CERT-EU's _Log Monitoring Service_ --
which we have been offering for years -- into a solution that provides more
value for our constituents, while simultaneously increasing our visibility on
potential threats, and the agility of our incident response.

The design goals listed stem from our experience running such a service.

## Design goals

### Ingest at will

- Before Morio, our log monitoring service was based on a commercial SIEM,
which has a volume-based licensing model.
This made cost a significant factor when making decisions about what data to
ingest (or not to).
- With Morio, we wanted to minimise the cost impact of ingesting additional data
allowing us to ingest all the data we deem valuable.

### More types of data

- Before Morio, the only data type we collected were logs.
- With Morio, we wanted to support ingesting different data types, such as
  metrics, audit info, events, health checks, and so on.

### Streaming data

- Before Morio, our solution was based on batch-processing -- running a variety 
of queries at regular intervals to monitor the incoming data.
- With Morio, we wanted a streaming data solution, so we can get as close to
real-time as possible.

### Flexible ingestion

- Before Morio, any data we ingested would make its way into our SIEM.
- With Morio, we wanted the flexibility to not merely ingest data, but also
route, filter, transform, or duplicate data streams along the way. 

### Single pane of glass

- Before Morio, our log monitoring service was focussed on on-prem
infrastructure, while we used the cloud providers' native tools to monitor
cloud infrastructure. 
- With Morio, we want a single pane of glass to monitor all infrastructure under
our care.

### Structured data

- Before Morio, making sense of the various sources of data that we collect would
take up a considerable amount of our time.
- With Morio, we want to ensure data is properly structured at ingestion-time, so
we can process and store it much more efficiently.

### Low maintenance

- Before Morio, maintaining the solution required too much time and effort.
- With Morio, we want an _appliance-like_ experience with minimal maintenance.

### Automation friendly

- Before Morio, deploying our log monitoring solution required a lot of manual
  work, such as clicking around in a web UI, editing configuration files by
  hand, restarting services, trial and error while trying to build custom event
  log parsing expressions.
- With Morio, we wanted to make it easy to automation the rollout and
  maintenance of our solution.

## Technology choices

Given the design goals listed above, we have made the following choices:

### Docker for deployment

Given that we need to make various components work together without stepping on
each other's toes, we chose [Docker](https://www.docker.com/) containers to 
deploy the various services that make up Morio.

### Docker/Swarm for orchestration

When multiple containers need to work together, we enter the realm of
_orchestration_ with is the domain of projects like
[Kubernetes](https://kubernetes.io/), [Nomad](https://www.nomadproject.io/), or
[Rancher](https://www.rancher.com/about).

Given that we absolutely wanted to avoid forcing that level of complexity upon our
constituents, and that RedPanda brokers [do no support auto-scaling](https://docs.redpanda.com/current/manage/kubernetes/k-scale-redpanda/#horizontal-scaling) anyway, we opted for a simpler solution:

- Provide orchestration within Morio.
- Utilise [Docker Swarm](https://docs.docker.com/engine/swarm/) for cluster networking.


### RedPanda as our streaming backbone

Since we want [streaming data](#streaming-data) we considered
[Kafka](https://kafka.apache.org/) as it is the de-facto standard streaming platform.
However, it is also notoriously complex to run in production, which
clashes with our [low maintenance](#low-maintenance) goal.

This complexity has not gone unnoticed, and other players have stepped in,
providing simpler offerings with a Kafka-compatible API.

One of those is [RedPanda](https://redpanda.com/) which is our choice for
Morio's streaming backbone due to it simple setup, configuration, and
management.

### Beats for data collection & shipping

To collect data from on-prem systems, we need some sort of agent.

Here, our choice for Morio is [Beats by Elastic](https://www.elastic.co/beats)
because it is easy to install, configure, and manage, has native support
for pushing data to Kafka, and handles back pressure which makes for a
resilient setup.

As a foreshadowing bonus, it generates ECS compliant data by default.

### Data structured according to the Elastic Common Schema

Structured data does not _just happen_. You need to make sure it happens, and
the first thing you need is a _schema_, a set of rules that defines how the
data should be structured.

We considered [OpenTelemetry](https://opentelemetry.io/) but found it to be a
bit too uncooked for our needs.  Instead, we choice the [Elastic Common Schema
(ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) as it is more
mature, well defined, and supported by variety of systems and vendors.

### Logstash for data routing

When it comes to replicating data between Kafka(-compatible) systems, [Kafka
MirrorMaker](https://kafka.apache.org/documentation/#basic_ops_mirror_maker) is
a popular choice for those who are already running Kafka.

For Morio, we wanted simpler, and preferably something that can provide the
[flexible ingestion](#flexible-ingestion) we are looking for.
As it happens, [Logstash](https://www.elastic.co/logstash) is a Swiss-army
knife of data pipelines, and its vast array of [input
plugins](https://www.elastic.co/guide/en/logstash/current/input-plugins.html),
[output
plugins](https://www.elastic.co/guide/en/logstash/current/output-plugins.html),
and [filter
plugins](https://www.elastic.co/guide/en/logstash/current/filter-plugins.html)
provide all the flexibility one can ask for. Even better news is that it can
enforce the Elastic Common Schema.

That is why Logstash is our choice for data routing in Morio.

### Step-ca as Certificate Authority

For X.509 certificates, Morio needs an on-board Certificate Authority (CA) as a
[low maintenance](#low-maintenance) solution should transparently handle the
complexity of generating and managing certificates.

Here we chose [step-ca](https://smallstep.com/docs/step-ca/) because we had
prior experience with it, has a small footprint, and
[ACME](https://en.wikipedia.org/wiki/Automatic_Certificate_Management_Environment)
support.

### Rqlite as database

Morio needs a database to store user accounts and other data. Ideally we want
something simple like [SQLite](https://www.sqlite.org/), but as we support
[clustered deployments](/docs/guides/deploy/#clustered-deployment) we need a
database that itself can be clustered too.

Setting up and maintaining a database cluster is typically non-trivial and
seems hard to rhyme with our [low maintenance](#low-maintenance) goal.  What we
want is something _like_ SQLite but that can be clustered. We considered both
[LiteFS](https://fly.io/docs/litefs/) and [Dqlite](https://dqlite.io/) but in
the end our choice for Morio's database is [Rqlite](https://rqlite.io/) as its
HTTP REST API fits nicely within our design centered around HTTP-based
microservices.

### Traefik as reverse proxy

Morio provides several HTTP-based microservices, some of which are exposed to
the user.  It's a common scenario to have a reverse proxy handle ingress
traffic, which gives us a central place to enforce access control, setup
certificates and so on.

We chose [Traefik](https://traefik.io/traefik/) for this purpose as it is a
true reverse proxy and has excellent Docker support.

### Javascript for development

Last but not least, we needed to choose a programming language to develop those
components of Morio that are built in-house. We took the following
considerations into account:

- __Count__: We wanted to limit the number of languages required to work on
  Morio. Preferably, one is enough.
- __Purpose__: We wanted to use a language that meshes well with what we want
  to do.
- __Modularity__: We want to allow people to add their own code for processing
  data.
- __Speed__: We need to make sure that stream processing is fast enough to not
  be a throughput bottleneck.

At CERT-EU, [Python](https://www.python.org/) is the de-facto standard
programming language.  However, it has two important disadvantages, one of them
rather crucial:

- __Count__: There is no way around it, for the web interface, we rely on
  Javascript. Adding Python means dealing with two languages.
- __Speed__: We are concerned that Python is simply too slow for the kind of
  throughput we hope to achieve.

In the end, we chose
[Javascript](https://www.javascript.com/)/[NodeJS](https://nodejs.org/en) as
the programming language for Morio as it is fast, available both in the browser
and backend, fit for purpose, and its interpreted nature makes it easy to load
code in a modular way.

## Architecture

A single Morio node consists of a set of services running in Docker containers.
To _start_ Morio, one needs to only start the __core__ service, as it will
handle orchestration of all other services.

When Morio is initially started, it has no configuration and will start in an
[ephemeral state](/docs/reference/terminology/ephemeral-state/). As this is
the simplest state Morio can be in, we will start there.

### Ephemeral Node

An [ephemeral Morio node](/docs/reference/terminology/ephemeral-node/) is a
node running in [ephemeral
state](/docs/reference/terminology/ephemeral-state/).   
To bring Morio out of its ephemeral state, it needs to be set up. This can be
done through the [UI][ui] or [API][api] service, both of which can only be
accessed through the [Proxy][proxy] service.


This is why -- in the absence of a configuration -- the [Core][core] service
will start these three services on an ephemeral Morio node, and eagerly await
setup instructions.

<Architecture caption="Schematic overview of an ephemeral Morio node">
```
flowchart TD
  subgraph Host OS
    api("API<br /><small>(Morio)</small>")
    core("Core<br /><small>(Morio)</small>")
    proxy("Proxy<br /><small>(Traefik)</small>")
    ui("UI<br /><small>(Morio)</small>")
    net(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    core --- net
    net --- proxy
    net --- api
    net --- ui
  end
  user("Morio User")
  proxy --- user
  class core blue;
  class api blue;
  class ui blue;
  class proxy blue;
```
</Architecture>

### Stand-Alone Node

When we provide a Morio node with its initial settings, it will come out of
ephemeral state.  The [Core][core] service will resolve a configuration for all
[wanted][wanted] services, and start them.

Whether a service is _wanted_ or not depends on the settings.
<br /><small>In practice, it
depends on the outcome of the [wanted lifecycle hook][wanted] that is called 
for each service.</small>  
For example, the [Connector][connector] service will only be started if any
pipelines have been configured. Because without any pipelines, it has no work
to do.

If we assume pipelines have been setup, and we are routing data both to some
local data store, as well as an downstream Morio instance, the schematic overview
looks like this:

<Architecture caption="Schematic overview of a stand-alone Morio deployment">
```
flowchart TD

  lake[("Local Data Store")]
  downstream[("Downstream Morio")]
  subgraph Host OS
    dbuilder("[D|R|M|W]Builder<br /><small>(Morio)</small>")
    api("API<br /><small>(Morio)</small>")
    broker[("Broker\n<small>(RedPanda)</small>")]
    ca("CA\n<small>(SmallStep)</small>")
    connector("Connector<br/><small>(Logstash)</small>")
    console("Console\n<small>(RedPanda)</small>")
    core("Core<br /><small>(Morio)</small>")
    db[("DB<br /><small>(Rqlite)</small>")]
    proxy("Proxy<br /><small>(Traefik)</small>")
    ui("UI<br /><small>(Morio)</small>")

    net(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])

    db --- net
    ca --- net
    connector --- net
    core --- net

    net --- proxy
    net --- api
    net --- ui
    net --- console
    net --- broker
    
  end
  downstream --- connector
  lake --- connector
  client("Morio Client System")
  user("Morio User")

  broker --- client
  proxy --- user

  class core blue;
  class api blue;
  class ui blue;
  class proxy blue;
  class ca green;
  class connector green;
  class console green;
  class db green;
  class broker green;
  class dbuilder orange;
```
</Architecture>

More services are started now, including the [DB][db] service for storing
account data, the [CA][ca] service for generating X.509 certificates, and of
course the [Broker][broker] service to handle streaming data, and it's
[Console][console] admin service.

Morio is now ready to start ingesting data. In our example, the
[Connector][connector] service is configured with pipelines that will send the
data to a local data store (see the list of [supported
outputs](https://www.elastic.co/guide/en/logstash/current/output-plugins.html))
as well as to a remote Morio instance. Based on the direction of the data
stream, we call this a __downstream__ instance.

The [Dbuilder][dbuilder], [Rbuilder][rbuilder], [Mbuilder][mbuilder], and
[Wbuilder][wbuilder] services are represented by a single amber box in our
diagram. They are the on-demand services that build the client packages.
Dbuilder and Rbuilder build `.deb`, and `.rmp` packages for Linux, whereas
Mbulder and Wbuilder build packages for MacOS and Windows respectively.

### Flanking Nodes

A [flanking Morio node](/docs/guides/nodes/#flanking-nodes) is a node that
runs _flanking services_. These are services that act as a client to the Morio
node(s) -- typiocally of the broker(s) -- and do not need to reside on them.

In our example, the [Connector][connector] is a flanking service that we could
run on a flanking node.  Such a setup is shown in the diagram below:

<Architecture caption="Schematic overview of a stand-alone Morio deployment with a flanking node running the Connector service">
```
flowchart TD

  lake[("Local Data Store")]
  downstream[("Downstream Morio")]
  subgraph Host OS
    dbuilder("[D|R|M|W]Builder<br /><small>(Morio)</small>")
    api("API<br /><small>(Morio)</small>")
    broker[("Broker\n<small>(RedPanda)</small>")]
    ca("CA\n<small>(SmallStep)</small>")
    console("Console\n<small>(RedPanda)</small>")
    core("Core<br /><small>(Morio)</small>")
    db[("DB<br /><small>(Rqlite)</small>")]
    proxy("Proxy<br /><small>(Traefik)</small>")
    ui("UI<br /><small>(Morio)</small>")

    net(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])

    db --- net
    ca --- net
    core --- net

    net --- proxy
    net --- api
    net --- ui
    net --- console
    net --- broker
    
  end
  subgraph Flanking Node
    connector("Connector<br/><small>(Logstash)</small>")
    core2("Core<br /><small>(Morio)</small>")
    net2(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    core2 --- net2
    connector --- net2
  end
  downstream --- connector
  lake --- connector
  client("Morio Client System")
  user("Morio User")

  broker --- client
  proxy --- user
  net --- |IPSec|net2

  class core blue;
  class core2 blue;
  class api blue;
  class ui blue;
  class proxy blue;
  class ca green;
  class connector green;
  class console green;
  class db green;
  class broker green;
  class dbuilder orange;
```
</Architecture>

Flanking nodes can be scaled horizontally, independent of the sizing of other
Morio nodes. They will be connected to the Morio node(s) using an
[IPSec-encrypted](https://en.wikipedia.org/wiki/IPsec) Docker overlay network.

The same overlay network is also how nodes communitate in a Morio cluster.

### Clustered Nodes

<Architecture caption="Schematic overview of a 3-node Morio cluster">
```
flowchart TD

  lake[("Local Data Store")]
  downstream[("Downstream Morio")]
  subgraph Node 1
    dbuilder1("[D|R|M|W]Builder<br /><small>(Morio)</small>")
    api1("API<br /><small>(Morio)</small>")
    broker1[("Broker\n<small>(RedPanda)</small>")]
    ca1("CA\n<small>(SmallStep)</small>")
    connector1("Connector<br/><small>(Logstash)</small>")
    console1("Console\n<small>(RedPanda)</small>")
    core1("Core<br /><small>(Morio)</small>")
    db1[("DB<br /><small>(Rqlite)</small>")]
    proxy1("Proxy<br /><small>(Traefik)</small>")
    ui1("UI<br /><small>(Morio)</small>")
    net1(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    db1 --- net1
    ca1 --- net1
    connector1 --- net1
    core1 --- net1
    net1 --- proxy1
    net1 --- api1
    net1 --- ui1
    net1 --- console1
    net1 --- broker1
  end

  subgraph Node 2
    dbuilder2("[D|R|M|W]Builder<br /><small>(Morio)</small>")
    api2("API<br /><small>(Morio)</small>")
    broker2[("Broker\n<small>(RedPanda)</small>")]
    ca2("CA\n<small>(SmallStep)</small>")
    connector2("Connector<br/><small>(Logstash)</small>")
    console2("Console\n<small>(RedPanda)</small>")
    core2("Core<br /><small>(Morio)</small>")
    db2[("DB<br /><small>(Rqlite)</small>")]
    proxy2("Proxy<br /><small>(Traefik)</small>")
    ui2("UI<br /><small>(Morio)</small>")
    net2(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    db2 --- net2
    ca2 --- net2
    connector2 --- net2
    core2 --- net2
    net2 --- proxy2
    net2 --- api2
    net2 --- ui2
    net2 --- console2
    net2 --- broker2
  end

  subgraph Node 3
    dbuilder3("[D|R|M|W]Builder<br /><small>(Morio)</small>")
    api3("API<br /><small>(Morio)</small>")
    broker3[("Broker\n<small>(RedPanda)</small>")]
    ca3("CA\n<small>(SmallStep)</small>")
    connector3("Connector<br/><small>(Logstash)</small>")
    console3("Console\n<small>(RedPanda)</small>")
    core3("Core<br /><small>(Morio)</small>")
    db3[("DB<br /><small>(Rqlite)</small>")]
    proxy3("Proxy<br /><small>(Traefik)</small>")
    ui3("UI<br /><small>(Morio)</small>")
    net3(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    db3 --- net3
    ca3 --- net3
    connector3 --- net3
    core3 --- net3
    net3 --- proxy3
    net3 --- api3
    net3 --- ui3
    net3 --- console3
    net3 --- broker3
  end

  downstream --- connector1
  downstream --- connector2
  downstream --- connector3
  lake --- connector1
  lake --- connector2
  lake --- connector3
  net1 --- |IPSec|net2
  net1 --- |IPSec|net3
  net2 --- |IPSec|net3
  rrdns{Round\nRobin\nDNS\nrecord}
  client("Morio Client System")
  user("Morio User")

  rrdns --- client
  broker1 --- rrdns
  broker2 --- rrdns
  broker3 --- rrdns

  class core1 blue;
  class core2 blue;
  class core3 blue;
  class api1 blue;
  class api2 blue;
  class api3 blue;
  class ui1 blue;
  class ui2 blue;
  class ui3 blue;
  class proxy1 blue;
  class proxy2 blue;
  class proxy3 blue;
  class ca1 green;
  class ca2 green;
  class ca3 green;
  class connector1 green;
  class connector2 green;
  class connector3 green;
  class console1 green;
  class console2 green;
  class console3 green;
  class db1 green;
  class db2 green;
  class db3 green;
  class broker1 green;
  class broker2 green;
  class broker3 green;
  class dbuilder1 orange;
  class dbuilder2 orange;
  class dbuilder3 orange;
```
</Architecture>

Things get a bit more complicated in a clustered deployment, but essentially it is more of the same.
We have 3 Morio nodes in our example, each of them runs the same services as [our stand-alone example](#stand-alone-node).

What's different is that we now have an IPSec tunnel connecting all the nodes, and the brokers work as a distributed system, sharing the load.

The round-robin DNS record is important for cluster discovery, but once connected the brokers will tell clients where to connect to.
This is important as it means that __you cannot run Morio behind a load balancer__, just like you cannor run Kafka behind a load balancer because it has load balancing on-board.



[api]: /docs/reference/services/api/
[broker]: /docs/reference/services/broker/
[ca]: /docs/reference/services/ca/
[connector]: /docs/reference/services/connector/
[console]: /docs/reference/services/console/
[core]: /docs/reference/services/core/
[db]: /docs/reference/services/db/
[proxy]: /docs/reference/services/proxy/
[ui]: /docs/reference/services/ui/
[dbuilder]: /docs/reference/services/dbuilder/
[rbuilder]: /docs/reference/services/rbuilder/
[mbuilder]: /docs/reference/services/mbuilder/
[wbuilder]: /docs/reference/services/wbuilder/
[wanted]: /docs/reference/services/core/hooks/wanted/

