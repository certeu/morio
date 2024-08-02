---
title: UI Service Guide
tags:
  - ui
---

The **Morio User Interface Service** (ui) provides a web-based
user interface for interacting with your Morio deployment.

The UI is built with [NextJS](https://nextjs.org/) and relies on
[the api service](/docs/guides/services/api) to provide functionality.

In other words, the UI does not have server-side code that _does_
anything. Instead, the UI runs in the browser and talks to the Morio API
to do what needs to be done.

## UI service responsibilities

The ui service runs on every Morio [broker node
](/docs/reference/terminology/broker-node/), and handles the following
responsibilities:

### Provide an intuitive way to interact with Morio

That's it. Perhaps easier said than done, but that's really all it has to do does.

