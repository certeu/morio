---
title: Morio Design Goals
---

Morio is an observability platform created by the engineering team at
[CERT-EU](https://cert.europa.eu/), the cybersecurity service for the
Institutions, Bodies, Agencies, and Offices of [the European Union
](https://europa.eu/).

The goals we've set and the choices we've made in Morio's design stem from our
experience as a _managed service provider_ with a specific focus on
cybersecurity. Not merely from our own vantage point, but also from that of our
constituents who we ultimately want to serve in the best way possible.

To understand _where we're coming from_ we have outlined our reasoning for how
Morio was designed in this brief guide.

## Design Goals

In no particular order, Morio's design goals are:

- **Keep it as simple as possible**
- **Provide state-of-the-art observability**
- **Utilise streaming data and a common data schema**
- **Remain agnostic about data storage and processing**
- **Prioritise resilience, flexibility, maintainability, and automation**

These high-level design goals are the distilled result of challenges we've
encountered over the years in this space. We hope they speak for themselves.

## Challenges

Morio is not our first foray into this problem domain. Based on our previous
experience, we have shortlisted the following challenges as things that _Morio
should do better_:

- **More types of data**
  - Before Morio, the only data type we collected were logs.
  - With Morio, we wanted to support ingesting different data types, such as
    metrics, audit info, events, or health checks.
- **Streaming data**
  - Before Morio, our solution was based on batch processing -- running a variety
    of queries at regular intervals to monitor the incoming data.
  - With Morio, we wanted a streaming data solution, so we can get as close to
    real-time as possible.
- **Flexible ingestion**
  - Before Morio, any data we ingested would make its way into our SIEM.
  - With Morio, we wanted the flexibility to not merely ingest data, but also
    route, filter, transform, or duplicate data streams along the way.
- **Single pane of glass**
  - Before Morio, our log monitoring service was focused on on-prem
    infrastructure, while we used the cloud providers' native tools to monitor
    cloud infrastructure.
  - With Morio, we want a single pane of glass to monitor all infrastructure under
    our care.
- **Structured data**
  - Before Morio, making sense of the various sources of data that we collect would
    take up a considerable amount of our time.
  - With Morio, we want to ensure data is properly structured at ingestion-time, so
    we can process and store it much more efficiently.
- **Low maintenance**
  - Before Morio, maintaining the solution required too much time and effort.
  - With Morio, we want an _appliance-like_ experience with minimal maintenance.
- **Automation friendly**
  - Before Morio, deploying our log monitoring solution required a lot of manual
    work, such as clicking around in a web UI, editing configuration files by
    hand, restarting services, trial and error while trying to build custom event
    log parsing expressions.
  - With Morio, we wanted to make it easy to automate the rollout and
    maintenance of our solution.

## Technology choices

To accomplish our goals and overcome the challenges we want Morio to tackle, we
have made the following technology choices in Morio:

### Docker for deployment

Given that we need to make various components work together without stepping on
each other's toes, we chose [Docker](https://www.docker.com/) containers to
deploy the various services that make up Morio.

<small>**Design goal**: Keep it as simple as possible</small> |
<small>**Challenges**: Automation friendly / Low maintenance</small>

### No external orchestration

When multiple containers need to work together, we enter the realm of
_orchestration_ with is the domain of projects like
[Kubernetes](https://kubernetes.io/), [Nomad](https://www.nomadproject.io/), or
[Rancher](https://www.rancher.com/about).

Given that we absolutely wanted to avoid forcing that level of complexity upon our
constituents, and that RedPanda brokers [do no support auto-scaling](https://docs.redpanda.com/current/manage/kubernetes/k-scale-redpanda/#horizontal-scaling) anyway, we opted to make Morio handle its own orchestration.

<small>**Design goal**: Keep it as simple as possible</small> |
<small>**Challenges**: Automation friendly / Low maintenance</small>

### RedPanda as our streaming backbone

Since we want streaming data we considered
[Kafka](https://kafka.apache.org/) as it is the most common streaming platform.
However, it is also notoriously complex to run in production, which
clashes with our design goals.

This complexity has not gone unnoticed, and other players have stepped in,
providing simpler offerings with a Kafka-compatible API.
One of those is [RedPanda](https://redpanda.com/) which is our choice for
Morio's streaming backbone due to it simple setup, configuration, and
API-based management.

<small>**Design goal**: Keep it as simple as possible / Provide state-of-the-art observability / Utilise streaming data and a common data schema / Prioritise resilience, flexibility, maintainability, and automation</small> |
<small>**Challenges**: Streaming data / Low maintenance / Automation friendly</small>

### Beats for data collection & shipping

To collect data from on-prem systems, we need some sort of agent.

Here, our choice for Morio is [Beats by Elastic](https://www.elastic.co/beats)
because it is easy to install, configure, and manage, has native support
for pushing data to Kafka(-compatible) systems, and handles back pressure which makes for a
resilient setup.

As a foreshadowing bonus, it generates ECS compliant data by default.

<small>**Design goal**: Provide state-of-the-art observability / Utilise streaming data and a common data schema / prioritise resilience, flexibility, maintainability, and automation</small> |
<small>**Challenges**: More types of data / Streaming data / Structured data / Automation friendly</small>

### Data structured according to the Elastic Common Schema

Structured data does not _just happen_. You need to make sure it happens, and
the first thing you need is a _schema_, a set of rules that defines how the
data should be structured.

We considered [OpenTelemetry](https://opentelemetry.io/) but found it to be a
bit too under cooked for our needs. Instead, we chose the [Elastic Common Schema
(ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) as it is more
mature, well defined, and supported by variety of systems and vendors.

<small>**Design goal**: Utilise streaming data and a common data schema</small> |
<small>**Challenges**: Structured data</small>

### Logstash for data routing

When it comes to replicating data between Kafka(-compatible) systems, [Kafka
MirrorMaker](https://kafka.apache.org/documentation/#basic_ops_mirror_maker) is
a popular choice for those who are already running Kafka.

For Morio, we wanted simpler, and preferably something that can provide the
flexible ingestion we are looking for.
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

<small>**Design goal**: Remain agnostic about data storage and processing</small> |
<small>**Challenges**: Flexible ingestion</small>

### Step-ca as Certificate Authority

For X.509 certificates, Morio needs an on-board Certificate Authority (CA) as a
low maintenance solution that should transparently handle the
complexity of generating and managing certificates.

Here we chose [SmallStep's step-ca](https://smallstep.com/docs/step-ca/) because we had
prior experience with it, has a small footprint, and supports
[the ACME protocol](https://en.wikipedia.org/wiki/Automatic_Certificate_Management_Environment) (of Let's Encrypt fame).

In addition, [the SmallStep team was open to us contributing an Rqlite storage
backend](https://github.com/smallstep/nosql/issues/64), something we needed to
provide a highly available CA service in Morio.

<small>**Design goal**: Keep it as simple as possible</small> |
<small>**Challenges**: Low maintenance / Automation friendly</small>

### Rqlite as database

Morio needs a database to store user accounts and other data. Ideally we want
something simple like [SQLite](https://www.sqlite.org/), but as we support
clustered deployments we need a distributed database.

Setting up and maintaining a database cluster is typically non-trivial and
seems hard to rhyme with keeping it as simple as possible.

What we want is something _like_ SQLite but that can be clustered. We considered both
[LiteFS](https://fly.io/docs/litefs/) and [Dqlite](https://dqlite.io/) but in
the end our choice for Morio's database is [Rqlite](https://rqlite.io/) as its
HTTP REST API fits nicely within our design centered around HTTP-based
microservices, and [its maintainer graciously offered their support to add
Rqlite as a storage backend to Step-CA
](https://github.com/smallstep/nosql/issues/64#issuecomment-2249985726).

<small>**Design goal**: Keep it as simple as possible</small> |
<small>**Challenges**: Low maintenance / Automation friendly</small>

### Traefik as reverse proxy

Morio provides several HTTP-based microservices, some of which are exposed to
the user. It's a common scenario to have a reverse proxy handle ingress
traffic, which gives us a central place to enforce access control, setup
certificates and so on.

We chose [Traefik](https://traefik.io/traefik/) for this purpose as it is a
dedicated reverse proxy with good support for automated configuration, and
an intuitive built-in dashboard that makes it easy for people to _look under
the hood_ of Morio.

<small>**Design goal**: Keep it as simple as possible / prioritise resilience, flexibility, maintainability, and automation</small> |
<small>**Challenges**: Low maintenance / Automation friendly</small>

### JavaScript for development

Last but not least, we needed to choose a programming language to develop those
components of Morio that are built in-house. We took the following
considerations into account:

- **Count**: We wanted to limit the number of languages required to work on
  Morio. Preferably, one is enough.
- **Purpose**: We wanted to use a language that meshes well with what we want
  to do.
- **Modularity**: We want to allow people to add their own code for processing
  data.
- **Speed**: We need to make sure that stream processing is fast enough to not
  be a throughput bottleneck.

At CERT-EU, [Python](https://www.python.org/) is the default
programming language. However, it has two important disadvantages, one of them
rather crucial:

- **Count**: There is no way around it, for the web interface, we rely on
  JavaScript. Adding Python means dealing with two languages.
- **Speed**: We are concerned that Python is simply too slow for the kind of
  throughput we hope to achieve.

In the end, we chose
[JavaScript](https://www.javascript.com/)/[NodeJS](https://nodejs.org/en) as
the programming language for Morio as it is fast, available both in the browser
and backend, fit for purpose, and because its interpreted nature makes it easy to load
code in a modular way.

<small>**Design goal**: Keep it as simple as possible / prioritise resilience, flexibility, maintainability, and automation</small> |
<small>**Challenges**: Streaming data </small>

## Summary

As you can see from our [technology choices](#technology-choices), Morio wraps a
number of best-of-breed open source components to create a turn-key observability and streaming data platform.
Morio abstracts away the underlying complexity of configuring each of these services yourself,
instead you can _Just run Morio_.

Anyone with sufficient expertise, time, and dedication can build a
state-of-the-art streaming data infrastructure and observability solution out
of the components we have chosen. And if that is the kind of thing you are itching
to setup and maintain, then by all means, go for it.

What we hoped to accomplish with Morio is to bring these technologies together
as a neat, pre-made bundle so that everyone can enjoy them without the steep
learning curve.

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
