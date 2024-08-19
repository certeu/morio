---
title: Connector Service Guide
tags:
  - connector
---

The **Morio Connector Service** (connector) is responsible for routing data
between external systems, including remote Morio deployments.

## Console service responsibilities

The connector service is a [flanking
service](/docs/reference/terminology/flanking-service), and optional. It will
only be started when pipelines have been configured in the Morio settings.

### Running ETL pipelines

The console service is responsible for running the pipelines that are configured
in the Morio settings.

These pipelines are sometimes referred to as [ETL
pipelines](https://en.wikipedia.org/wiki/Extract,_transform,_load), but it's
important to understand that these pipelines operate on streaming data, and are
not batch pipelines which are the more common way of doing ETL.
