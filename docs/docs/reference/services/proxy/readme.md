---
title: Proxy
tags:
  - proxy
---

The `proxy` service provides the HTTP edge router for Morio services.
It is the entrypoint for all HTTP based access.

This service utilizes [Traefik](https://traefik.io/traefik/), a reverse
proxy and ingress controller that is simple to operate, yet flexible.

<Note>
This service __is available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/)
</Note>

<WithCaption caption="Screenshot of the dashboard provided by the proxy service">
![Screenshot of the dashboard provided by the proxy service](./traefik-light.png#gh-light-mode-only)
![Screenshot of the dashboard provided by the proxy service](./traefik-dark.png#gh-dark-mode-only)
</WithCaption>

