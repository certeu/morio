---
title: CA
tags:
  - ca
---

The `ca` cervice provides a certificate authority (CA) to provision X-509 certificates.

This service utilizes [SmallStep's step-ca](https://smallstep.com/) under the hood.

The CA service provides X-509 certificates for Morio's own use -- such as mTLS
authentication to the broker API for Morio clients -- but Morio also exposes
both an API endpoint to generate certificates, as well as support for [the ACME
protocol](https://en.wikipedia.org/wiki/Automatic_Certificate_Management_Environment).

<Tip>
You can optionally use this service as your own internal CA
</Tip>

<Note>
This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/).
</Note>

