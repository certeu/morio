---
title: Morio Management API
---

The Morio Management API is the main user-facing API in Morio.  It is an
[OpenAPI v3.1](https://swagger.io/specification/) compliant API, with
[auto-gereated reference docuumentation](/oas-api).

In other words, if you're already familiar with the API, and are merely looking
for for answers on which endpoint to use or what data to expect, refer to
[/openapi-api](/oas-api).

If you're new to this API, read on for a gentle introduction.

## Purpose of Morio's Management API

Morio's Management API (the API) provides all functionality that you can access
through the Morio user interface (UI).

This includes configuring Morio, as well as handling identity providers,
enabling and disabling services, managing user accounts and API keys,
generating certificates, and building client packages.

This API is Morio's main user-facing API, and when we mention _the API_ in the
Morio documentation without being specific about _which API_ this is, you can
assume we are referring to this one.

## Accessing the API

The API itself is available on all Morio nodes, and can be accessed under the
prefix `/-/api/`.

The reference documentation also is relative to this prefix. So to access teh
the `/status` endpoint of this API on a Morio node, you should access
`/-/api/status`.

<Note>

### This is a preset, we are using the default value in the documentation

The prefix to the Morio API is stored in the `MORIO_API_PREFIX` preset.
We are using `/-/api` here as that is the default value, but it is possible
that this has been changed when Morio was deployed by your _LOMO_.

</Note>

