---
title: Proxy Service Guide
tags:
  - proxy
---

The **Morio Proxy Service** (proxy) provides an application proxy that
is the main entry point for all HTTP-based traffic in Morio.

This service is backend by [Traefik](https://traefik.io/traefik/) a
modern reverse proxy that lends itself well to integration with Morio.

<Note title="Learn more">
If you would like to learn more than what is covered in this guide, 
please [refer to the Traefik Documentation
](https://doc.traefik.io/).
</Note>

## Proxy service responsibilities

The proxy service runs on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### TLS Termination

With the exception of ACME discovery, all HTTP-based traffic in Morio
is encrypted with TLS. The proxy service is responsible for terminating
that TLS connection.

### Automated certificate Provisioning

The proxy service works in tandem with [the CA
service](/docs/guides/services/ca) to automatically provision X.509
certificates for all HTTP-based Morio services.

### Authentication

While the proxy service does not handle authentication itself -- it is [the
api service who does](/docs/guides/services/api) it is crucial in Morio's
authentication flow as it is [ForwardAuth
middleware](https://doc.traefik.io/traefik/middlewares/http/forwardauth/) on
the proxy service that intercepts all HTTP requests and passes them to the api
service for authentication. Only if the API allows the request will the proxy
service pass it to the backend service.

## URL-based Request Routing

The proxy service is responsible for routing requests to the correct backend service.

For example, the URLs `/login`, `/console`, or `/-/api/status` target the UI,
console, and api services respectively. It is the proxy service's job to route
the request to the correct backend service based on the URL.

## URL Rewriting

As Morio uses URL-based routing -- rather than using subdomains for example --
we sometimes need to match the constraints imposed by the URL-based routing
with the URL patterns expected by the backend service.

Where needed, it is the proxy service who will rewrite the request URL to
allow it to hit the backend system in expected way, while also allowing us to
use a specific prefix for routing the request.

## Proxy Dashboard

Last but not least, the proxy service provides a dashboard at `/dashboard`
that shows that status and configuration of the proxy service.
