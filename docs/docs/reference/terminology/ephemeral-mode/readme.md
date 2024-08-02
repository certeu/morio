---
title: Ephemeral Mode
---

Before a Morio node receives its initial settings, it will run in an ephemeral
mode, where it does nothing but eagerly await its setup.

To bring a node out of its ephemeral mode, you need to provide initial
settings.
You can use the setup wizard of the ui service to do so, or use the API service
directly.

<WithCaption caption="Screenshot of the Morio UI in ephemeral mode">
![Morui UI in ephemeral state](./ephemeral-light.png#gh-light-mode-only)
![Morui UI in ephemeral state](./ephemeral-dark.png#gh-dark-mode-only)
</WithCaption>
