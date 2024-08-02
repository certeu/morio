---
title: Errors
---

Given that status codes are sometimes not sufficient to convey enough
information about an error to be helpful, the [Morio Management
API](/docs/guides/apis/api) and [the Morio Core API](/docs/guides/apis/core)
implement the **Problem Details for HTTP APIs** specification
([RFC7807](https://datatracker.ietf.org/doc/html/rfc7807)).

Here is an example of such an error response:

```json
{
  "type": "https://morio.it/docs/reference/errors/morio.api.schema.violation",
  "status": 400,
  "title": "This request violates the data schema",
  "detail": "The request data failed validation against the Morio data schema. This means the request is invalid."
}
```

As you can see, the `type` field of the error response is a URL, which leads to
[the error's documentation
page](/docs/reference/errors/morio.api.schema.violation).

This is rather helpful when troubleshooting, so where possible -- even outside
API responses -- Morio will make errors a URL that leads to the relevant documentation page.



## List of Morio Error Types

<SubPages />

