---
title: API Service Guide
tags:
  - api
---

The **Morio API Service** (api) provides the main user-facing API in Morio.
It is an [OpenAPI v3.1](https://swagger.io/specification/) compliant API, with
[auto-generated reference documentation](/oas-api).

<Related>
This guide talks about the why and how of the API service.  
To learn how to use the API, please [refer to the Management API Guide
](/docs/reference/apis/api/).
</Related>

## API service responsibilities

The api service runs on every Morio node, and handles the following
responsibilities:

### Authentication

The api service handles all HTTP-based authentication within Morio.
The only authentication within Morio that is not handled by the API is the
native Kafka protocol which uses mutual TLS (mTLS), which is why we say _all
HTTP-based authentication_.

In practice, we use [ForwardAuth
middleware](https://doc.traefik.io/traefik/middlewares/http/forwardauth/) on
the proxy service to intercept all HTTP requests and pass them to the API's
`/auth` endpoint for authentication. This allows us to integrate the same
authentication with different APIs.

### Identity providers

Closely related to authentication, the api service also handles all
[authentication providers](/docs/guides/idps).

From the built-in providers like `apikey` and `local`, it is the api that will
create user account or keys, write them to the database, generate one-time
password secrets, and so on. For external providers, like `ldap`, it is the api
service that will reach out to the external LDAP service to verify your
credentials.

### Core access

As the main user-facing API, some of the API's endpoint under the hood rely on
functionality of the core service. Things like setting up Morio or updating
the settings, or starting and stopping containers are all handled by core.

However, it is the api service that will accept these requests, authenticate
them, and make sure everything is ok before passing them on to the core service
on your behalf.

### Integration with other systems

Apart from the identity providers, which for some are already a sort of
integration in their own way, the api service also provides specific endpoints
to facilitate integration with other systems.

For example, it has endpoints to load the configured identity providers, to
facilitate frontend integration, or an endpoint providing JWKS integration to
integration with systems like Hashicorp Vault.
