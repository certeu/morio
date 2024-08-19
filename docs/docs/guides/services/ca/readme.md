---
title: CA Service Guide
tags:
  - ca
---

The **Morio Certificate Authority Service** (ca) provides a Certificate Authority that is used
to facilitate TLS encryption for and between Morio services (and clients).

While the ca service is used internally, Morio also makes the service
available as running a Certificate Authority is non-trivial, so it's
certainly _nice to have_ that Morio comes with one out of the box.

<Related>
If you would like to learn more than what is covered in this guide, 
please [refer to the SmallStep Documentation
](https://smallstep.com/docs/step-ca/).
</Related>

## CA service responsibilities

The ca service runs on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Internal Certificate Provisioning

The CA is responsible for provisioning certificates that are used internally by
Morio to secure communication, as well as for mutual TLS (mTLS).

This happens through its API, with [the core
service](/docs/guides/services/core) handling the actual API request.

### API Certificate Provisioning

The CA also supports generating certificates through [the API service
](/docs/guides/services/api).

Refer to the [`/ca/certificate`](/oas-api#tag/cryptography/paths/~1ca~1certificate/post) API endpoint for details.

### ACME Certificate Provisioning

Finally, the CA service also supports provisioning certificates via [the ACME
protocol](https://en.wikipedia.org/wiki/Automatic_Certificate_Management_Environment),
for _Let's Encrypt like_ functionality..

Refer to [the SmallStep documentation for how to configure popular clients to use ACME](https://smallstep.com/docs/tutorials/acme-protocol-acme-clients/#about-this-tutorial) with Morio's CA service (which is a Step-CA instance).

<Note>
Morio currently only supports the HTTP challenge type (`http-01`)
</Note>

## Can you trust the Morio Certificate Authority?

Not all Certificate Authorities are created equal.

On one hand of the spectrum are CAs that are globally trusted by browsers. The
GlobalSign, VeriSign, or Symantecs of this world, or the root CAs of large tech
companies like Amazon, Google, or Apple.

Morio's CA service is not on this end of the spectrum.

On the other hand of the spectrum is every CA spun up -- or every self-signed
certificate generated -- by a person or team that just needs some certificates
to encrypt communication or use mTLS. People that don't have an internal CA, or
have one but it requires a written request in duplicate signed by the CISO
before a certificate can be issued.

By making Morio's Certificate Authority available as a service, we hope to help
those people build great things.

At the end of the day, only you can decide what Certificate Authority is the
right fit for your use-case.
