---
title: DB
tags:
  - db
---

The `db` service provides a database service for Morio's internal data.

This service utilizes [Rqlite](https://rqlite.io/) under the hood.

The DB service stores account data and other information that needs to be
distributed in a Morio clustered deployment.

<Note>
This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/).
</Note>

