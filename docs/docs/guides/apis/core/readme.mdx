---
title: Core API Guide
---

The Morio Core API is internal to Morio and with the exception of [the
`/status` endpoint](/oas-core#tag/status/paths/~1status/get) is not accessible
to users.

The API is an [OpenAPI v3.1](https://swagger.io/specification/) compliant API,
with [auto-generated reference documentation](/oas-core).

In other words, if you're already familiar with the API, and are merely looking
for for answers on which endpoint to use or what data to expect, refer to
[/oas-core](/oas-core).

If you're new to this API, then most important thing to understand is that you
can safely ignore this API. It is internal only, and users or even
administrators of Morio are not supposed to use it or understand it.

This guide is intended for (aspiring) contributors, or anyone who would like to
gain a deeper understanding of how Morio works under the hood.

## Purpose of Morio's Core API

Morio's Core API (the API) provides functionality that spans various domains:

- **Cluster**: Accept Morio cluster invites from other nodes, and process the cluster heartbeat.
- **Cryptography**: Generate X.509 certificates and encrypt or decrypt data on demand
- **Docker**: Getting information from the Docker Daemon, restarting containers, and other Docker-related tasks
- **Client Packages**: Build client packages or provide their defaults
- **Settings**: Handle initial setup as well as updates to the Morio settings
- **Status**: Provide a consolidated status of all Morio services

## Accessing the API

<Note>
### Most Core API endpoints are not available in the network
As this is an internal API, the only endpoints that are available from the network are
the `/status` endpoint and the `/cluster/join` and `/cluster/heartbeat` endpoints.
</Note>

The API itself is available on all Morio nodes, and can be accessed under the
prefix `/-/core/`.

All documentation of API endpoints is relative to this prefix. So to access
the `/status` endpoint of this API on a Morio node, you should use
`https://[your-server-name]/-/core/status`.

<Note>

### This is a preset, we are using the default value in the documentation

The prefix to the Morio API is stored in [the `MORIO_CORE_PREFIX` preset
](/docs/reference/presets/morio_core_prefix).
We are using `/-/core` here as that is the default value, but it is possible
that this has been changed when Morio was deployed by your _LOMO_.

</Note>

If your server's DNS name
is `example.morio.it` , you could run this curl command to get the `/status`
endpoint:

```title=curl
curl https://example.morio.it/-/core/status
```

Or, if your system does not trust the Morio certificates:

```title=curl
curl --insecure https://example.morio.it/-/core/status
```

## Authentication

As an internal API, the Core API does not use or support authentication.
Most of its endpoints are not available on the network, but only internally.

Given that this API does not use authentication, it is worth going over the
routes that are available on the network and explain why no authentication is
used:

### The `/status` endpoint

Just as in [the Management API](/docs/guides/apis/api), this is a public or anonymous route.
So no authentication is required.

### The `/cluster/join` endpoint

Perhaps counter-intuitively, this too is a public or anonymous route.
However, it is only available while Morio is running in _ephemeral mode_.
While in _ephemeral mode_ Morio will eagerly await either its initial setup, or a cluster join request.

In other words, once Morio has received its initial settings, this endpoint
will no longer be available, and instead return an error response of type
[morio.core.ephemeral.required](/docs/reference/errors/morio.core.ephemeral.required/).

### The `/cluster/heartbeat` endpoint

While this too is a public or anonymous route -- by which we mean that no
authentication headers are required -- the cluster heartbeat payload will be
cryptographically signed and verified on each end.

This is done by including a checksum that holds a sha-256 hash of the
combination of the payload data, the Morio Root Token, and the password of the
internal secret key.

The checksum will be verified on both ends, thus guarding this endpoint against
abuse.
