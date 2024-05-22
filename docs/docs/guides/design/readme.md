---
title: High-level design
---

On this page we will go over the high-level design of Morio, as well as cover
our design objectives, and outline why we made the choices we made.

## History

[CERT-EU](https://cert.europa.eu/) is the cybersecurity service for the
Instituties, Bodies, Agencies, and Offices of the European Union (EU Entities).
In this role, we are a _managed service provider_ to our constituents, with a
specific focus on cybersecurity.

Morio's origins lie in the evolution of CERT-EU's _Log Monitoring Service_ --
which we have been offering for years -- into a solution that provides more
value for our constituents, while simultaneously increasing our visibility on
potential threats, and the agility of our incident response.

The design goals listed stem from our experience running such a service.

## Design goals

### Ingest at will

- Before Morio, our log monitoring service was based on
[Splunk](https://www.splunk.com/), which has a volume-based licensing model.
This made cost a significant factor when making decisions about what data to
ingest (or not to).
- With Morio, we wanted to minimize the cost impact of ingesting additional data
allowing us to ingest all the data we deem valuable.

### More types of data

- Before Morio, the only data type we collected were logs.
- With Morio, we wanted to support ingesting different data types, such as
  metrics, audit info, events, heartbeats, and so on.

### Streaming data

- Before Morio, our solution was based on batch-processing -- running a variety 
of queries at regular intervals to monitor the incoming data.
- With Morio, we wanted a streaming data solution, so we can get as close to
real-time as possible.

### Flexible ingestion

- Before Morio, any data we ingested would make its way into our SIEM.
- With Morio, we wanted the flexibility to note merely ingest data, but also
route, filter, transform, or duplicate data streams along the way. 

### Single pane of glass

- Before Morio, our log monitoring service was focuessed on on-prem
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
work and clicking around in a web UI.
- With Morio, we wanted to make it easy to automation the rollout and maintenance
of our solution.

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
- Utilize [Docker Swarm](https://docs.docker.com/engine/swarm/) for cluster networking.


### RedPanda as our streaming backbone

Since we want [streaming data](#streaming-data) we considered
[Kafka](https://kafka.apache.org/) as it is the de-facto standard streaming platform.
However, it is also notoriously complex to run in production, which
clashes with our [low maintenance](#low-maintenance) goal.

This complexity has not gone unnoticed, and other players have stepped in
provide simpler offerings with a Kafka-compatible API.

One of those is [RedPanda](https://redpanda.com/) which is our choice for
Morio's streaming backbone due to it simple setup, configuration, and
management.

### Beats for data collection & shipping

To collect data from on-prem systems, we need some sort of agent.

Here, our choice for Morio is [Beats by Elastic](https://www.elastic.co/beats)
because it is easy to install, configure, and manage, has native support
pushing data to Kafka, and handles backpressure giving us extra redundancy.

As a foreshadowing bonus, it pumps out ECS compliant data by default.

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

Morio need a database to store user accounts and other data. Ideally we want
something simple like [SQLite](https://www.sqlite.org/), but as we support
[clustered deployments](/docs/reference/deploy/#clustered-deployment) we need a
database that itsels can be clustered too.

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
traffic, which gives us a central place to enfore access control, setup
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

At CERT-EU, [Python](https://www.python.org/) is the de-facto standard programming language.
However, it has two important disadvantages, one of them rather crucial:

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

<Mermaid caption="Schematic overview of a stand-alone Morio deployment">
```
flowchart TD

  lake[("Local Data Lake")]
  upstream[("Upstream Morio")]
  subgraph Host OS
    api("Morio API")
    broker[("Broker")]
    ca("CA")
    connector("Connector")
    console("Console")
    core("Morio Core")
    db[("&nbsp;DB&nbsp;")]
    dbuilder("DBuilder")
    proxy("Proxy")
    ui("Morio UI")

    net(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Docker Network&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])

    db --- net
    ca --- net
    connector --- net
    core --- net
    dbuilder --- net

    net --- proxy
    net --- api
    net --- ui
    net --- console
    net --- broker
    
  end
  upstream --- connector
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
</Mermaid>


