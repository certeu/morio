---
title: Management API Guide
---

The Morio Management API is the main user-facing API in Morio.  It is an
[OpenAPI v3.1](https://swagger.io/specification/) compliant API, with
[auto-gereated reference documentation](/oas-api).

In other words, if you're already familiar with the API, and are merely looking
for for answers on which endpoint to use or what data to expect, refer to
[/oas-api](/oas-api).

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

All documentation of API endpoints is relative to this prefix. So to access 
the `/status` endpoint of this API on a Morio node, you should use
`https://[your-server-name]/-/api/status`. 

<Note>

### This is a preset, we are using the default value in the documentation

The prefix to the Morio API is stored in [the `MORIO_API_PREFIX` preset
](/docs/reference/presets/morio_api_prefix).
We are using `/-/api` here as that is the default value, but it is possible
that this has been changed when Morio was deployed by your _LOMO_.

</Note>

If your server's DNS name
is `example.morio.it` , you could run this curl command to get the `/status`
endpoint:

``` title=curl
curl https://example.morio.it/-/api/status
```

Or, if your system does not trust the Morio certificates:

``` title=curl
curl --insecure https://example.morio.it/-/api/status
```

## Authentication

<Tldr>
### JWT FTW
Grab a JSON Web Token from 
[the `/login` endpoint](/oas-api#tag/authentication/paths/~1login/post) and use it in subsequent API as your Bearer token.  
Pre-expiry, tokens can be renewed at [the `/token` endpoint](/oas-api#tag/authentication/paths/~1token/get).
</Tldr>

### Identity Providers

The Morio Management API supports all authentication types that are supported
by Morio for HTTP-based access.  In practical terms, HTTP-based authentication
in Morio is backed by an _identity provider_, of which there are currently four
supported types:

- [The `mrt` identity provider](/docs/guides/idps#mrt) lets you authenticate
  via __the Morio Root Token__
- [The `apikey` identity provider](/docs/guides/idps#apikey) lets you
  Authentication via an __API Key__
- [The `local` identity provider](/docs/guides/idps#local) lets you
  Authentication via a __Local Morio Account__
- [The `ldap` identity provider](/docs/guides/idps#ldap) lets you
  Authentication using an __LDAP account__, including LDAP-compatible backends
  such as Active Directory

### Logging In

Use [the `/login` endpoint](/oas-api#tag/authentication/paths/~1login/post) to exchange your credentials for a [JSON Web Token (JWT)](https://jwt.io/).
That JWT can then be used in subsequent API calls to authenticate them.

The [the `/login` endpoint]((/docs/guides/idps#mrt)) documentation includes examples for each dentity providers listed above.
The response from the API will include a `jwt` key that holds the JWT. Below is an example using [the `local` identity provider](/docs/guides/idps#local):

```json title="API Response Body"
{
  "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibG9jYWwudGVzdEFjY291bnQxNzIyMjM2OTIyMDQ4Iiwicm9sZSI6InVzZXIiLCJhdmFpbGFibGVfcm9sZXMiOlsidXNlciJdLCJoaWdoZXN0X3JvbGUiOiJ1c2VyIiwicHJvdmlkZXIiOiJsb2NhbCIsIm5vZGUiOiIzOWIwYjVmZC02NjQ4LTQxZjgtYjNiOS1kZjk2YzVkMTE1NzkiLCJjbHVzdGVyIjoiODYwMjkwNmYtNTQzNy00Y2NlLWIxNTAtN2MzMzg3ZGEzNmZhIiwiaWF0IjoxNzIyMjM2OTIzLCJuYmYiOjE3MjIyMzY5MjMsImV4cCI6MTcyMjI1MTMyMywiYXVkIjoibW9yaW8iLCJpc3MiOiJtb3JpbyIsInN1YiI6Im1vcmlvIn0.sij21XpVw2i6SjTZtms9Sl4WsTYh6wgcr0c79x7-6OQPaWam-Ne8t_mzcI5Opa8qOjdFBDBoRHjairzyURpQ-p0BmrDANp4gw17lAqvmgGySwTC-T0yqdRpvZLV85ZhSps3XqiTuWObOVztd3MOLc6xbbp-SEIk6VimzDWcSQbInDfTCbbx4OivWjIcpA6XGfVcXWWtZiJz7y8E8E2jrckV3jkqRUZuhZ_HIcOyh1LSKb4WWWybCcu-D6hC1VipX_oy2Q8227V-VY1Kgryxe-F8xckgBkIoFjdejVsz4UpkvWXsYEJEZjgKLC0zZEZJVaEJC3w6QpNj-nc5d5dgF0TDq_6T0GvTaoN_UZGBgYioGTd0wXHpw0Trzc0VQrN5O3yBYjnhsbwSWlhHlClSAbV_CCy2qUAyDOrXBGmOlIYN8YZ_eJe-wIYioISd9dd0h5rbTSjtMqpX8fDoRZv0jFraVDOk0eMwiGM_TKhsFfR3sx0samCt7k3nCTseLeufCxRUkBZmeoG7o0NrZ0tbTrUoS9XJX_PDK3v9u-Z1LqjmJe7nERG55gXQer-_a5yWn-LKWooAYFW3iLwZEpvAxQF_VtW2xoCkrj5BD9UOnotj6emHmK76oURrSd3waQ_EWmnwf86dSXPQiljp41jHt95V7jyN5P4my-ogotTKxoGA",
  "data": {
    "user": "local.testAccount1722236922048",
    "role": "user",
    "available_roles": [
      "user"
    ],
    "highest_role": "user",
    "provider": "local"
  }
}
```

### JSON Web Token

The value in the `jwt` key of the reponse body holds our JSON Web Token (JWT). 
It can be [decoded](https://jwt.io/) to reveal its payload data:

```json title='Decoded Payload Data of a JSON Web Token"
{
  "user": "local.testAccount1722236922048",
  "role": "user",
  "available_roles": [
    "user"
  ],
  "highest_role": "user",
  "provider": "local",
  "node": "39b0b5fd-6648-41f8-b3b9-df96c5d11579",
  "cluster": "8602906f-5437-4cce-b150-7c3387da36fa",
  "iat": 1722236923,
  "nbf": 1722236923,
  "exp": 1722251323,
  "aud": "morio",
  "iss": "morio",
  "sub": "morio"
}
```

### Bearer Authentication 

Now that you have your JWT, it functions as your _Bearer Token_ and you can use _Bearer Authentication_ in subsequent API requests.
To do so, pass the content of the JWT as the `Authorization` header, prefixed by `Bearer: `.
A JSON representation of the headers would look like this:

```json title="Bearer Authentication"
```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibG9jYWwudGVzdEFjY291bnQxNzIyMjM2OTIyMDQ4Iiwicm9sZSI6InVzZXIiLCJhdmFpbGFibGVfcm9sZXMiOlsidXNlciJdLCJoaWdoZXN0X3JvbGUiOiJ1c2VyIiwicHJvdmlkZXIiOiJsb2NhbCIsIm5vZGUiOiIzOWIwYjVmZC02NjQ4LTQxZjgtYjNiOS1kZjk2YzVkMTE1NzkiLCJjbHVzdGVyIjoiODYwMjkwNmYtNTQzNy00Y2NlLWIxNTAtN2MzMzg3ZGEzNmZhIiwiaWF0IjoxNzIyMjM2OTIzLCJuYmYiOjE3MjIyMzY5MjMsImV4cCI6MTcyMjI1MTMyMywiYXVkIjoibW9yaW8iLCJpc3MiOiJtb3JpbyIsInN1YiI6Im1vcmlvIn0.sij21XpVw2i6SjTZtms9Sl4WsTYh6wgcr0c79x7-6OQPaWam-Ne8t_mzcI5Opa8qOjdFBDBoRHjairzyURpQ-p0BmrDANp4gw17lAqvmgGySwTC-T0yqdRpvZLV85ZhSps3XqiTuWObOVztd3MOLc6xbbp-SEIk6VimzDWcSQbInDfTCbbx4OivWjIcpA6XGfVcXWWtZiJz7y8E8E2jrckV3jkqRUZuhZ_HIcOyh1LSKb4WWWybCcu-D6hC1VipX_oy2Q8227V-VY1Kgryxe-F8xckgBkIoFjdejVsz4UpkvWXsYEJEZjgKLC0zZEZJVaEJC3w6QpNj-nc5d5dgF0TDq_6T0GvTaoN_UZGBgYioGTd0wXHpw0Trzc0VQrN5O3yBYjnhsbwSWlhHlClSAbV_CCy2qUAyDOrXBGmOlIYN8YZ_eJe-wIYioISd9dd0h5rbTSjtMqpX8fDoRZv0jFraVDOk0eMwiGM_TKhsFfR3sx0samCt7k3nCTseLeufCxRUkBZmeoG7o0NrZ0tbTrUoS9XJX_PDK3v9u-Z1LqjmJe7nERG55gXQer-_a5yWn-LKWooAYFW3iLwZEpvAxQF_VtW2xoCkrj5BD9UOnotj6emHmK76oURrSd3waQ_EWmnwf86dSXPQiljp41jHt95V7jyN5P4my-ogotTKxoGA"
```

To do so in curl, use this syntax:

```
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibG9jYWwudGVzdEFjY291bnQxNzIyMjM2OTIyMDQ4Iiwicm9sZSI6InVzZXIiLCJhdmFpbGFibGVfcm9sZXMiOlsidXNlciJdLCJoaWdoZXN0X3JvbGUiOiJ1c2VyIiwicHJvdmlkZXIiOiJsb2NhbCIsIm5vZGUiOiIzOWIwYjVmZC02NjQ4LTQxZjgtYjNiOS1kZjk2YzVkMTE1NzkiLCJjbHVzdGVyIjoiODYwMjkwNmYtNTQzNy00Y2NlLWIxNTAtN2MzMzg3ZGEzNmZhIiwiaWF0IjoxNzIyMjM2OTIzLCJuYmYiOjE3MjIyMzY5MjMsImV4cCI6MTcyMjI1MTMyMywiYXVkIjoibW9yaW8iLCJpc3MiOiJtb3JpbyIsInN1YiI6Im1vcmlvIn0.sij21XpVw2i6SjTZtms9Sl4WsTYh6wgcr0c79x7-6OQPaWam-Ne8t_mzcI5Opa8qOjdFBDBoRHjairzyURpQ-p0BmrDANp4gw17lAqvmgGySwTC-T0yqdRpvZLV85ZhSps3XqiTuWObOVztd3MOLc6xbbp-SEIk6VimzDWcSQbInDfTCbbx4OivWjIcpA6XGfVcXWWtZiJz7y8E8E2jrckV3jkqRUZuhZ_HIcOyh1LSKb4WWWybCcu-D6hC1VipX_oy2Q8227V-VY1Kgryxe-F8xckgBkIoFjdejVsz4UpkvWXsYEJEZjgKLC0zZEZJVaEJC3w6QpNj-nc5d5dgF0TDq_6T0GvTaoN_UZGBgYioGTd0wXHpw0Trzc0VQrN5O3yBYjnhsbwSWlhHlClSAbV_CCy2qUAyDOrXBGmOlIYN8YZ_eJe-wIYioISd9dd0h5rbTSjtMqpX8fDoRZv0jFraVDOk0eMwiGM_TKhsFfR3sx0samCt7k3nCTseLeufCxRUkBZmeoG7o0NrZ0tbTrUoS9XJX_PDK3v9u-Z1LqjmJe7nERG55gXQer-_a5yWn-LKWooAYFW3iLwZEpvAxQF_VtW2xoCkrj5BD9UOnotj6emHmK76oURrSd3waQ_EWmnwf86dSXPQiljp41jHt95V7jyN5P4my-ogotTKxoGA" https://example.morio.it/token
```

### Cookie Authentication 

While Bearer Authentication is most useful for automated access and scripts, in a browser it is often easier to rely on Cookie Authentication instead. Which is the Morio Management API supports that too.

The APi will check the `morio` cookie for JWT content. So place the JSON Web Token in a cookie named `morio` to use this way to authenticate.

A JSON representation of the request cookies would look like this:

```json title="Cookie Authentication"
{
  "Cookie": "morio=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibG9jYWwudGVzdEFjY291bnQxNzIyMjM2OTIyMDQ4Iiwicm9sZSI6InVzZXIiLCJhdmFpbGFibGVfcm9sZXMiOlsidXNlciJdLCJoaWdoZXN0X3JvbGUiOiJ1c2VyIiwicHJvdmlkZXIiOiJsb2NhbCIsIm5vZGUiOiIzOWIwYjVmZC02NjQ4LTQxZjgtYjNiOS1kZjk2YzVkMTE1NzkiLCJjbHVzdGVyIjoiODYwMjkwNmYtNTQzNy00Y2NlLWIxNTAtN2MzMzg3ZGEzNmZhIiwiaWF0IjoxNzIyMjM2OTIzLCJuYmYiOjE3MjIyMzY5MjMsImV4cCI6MTcyMjI1MTMyMywiYXVkIjoibW9yaW8iLCJpc3MiOiJtb3JpbyIsInN1YiI6Im1vcmlvIn0.sij21XpVw2i6SjTZtms9Sl4WsTYh6wgcr0c79x7-6OQPaWam-Ne8t_mzcI5Opa8qOjdFBDBoRHjairzyURpQ-p0BmrDANp4gw17lAqvmgGySwTC-T0yqdRpvZLV85ZhSps3XqiTuWObOVztd3MOLc6xbbp-SEIk6VimzDWcSQbInDfTCbbx4OivWjIcpA6XGfVcXWWtZiJz7y8E8E2jrckV3jkqRUZuhZ_HIcOyh1LSKb4WWWybCcu-D6hC1VipX_oy2Q8227V-VY1Kgryxe-F8xckgBkIoFjdejVsz4UpkvWXsYEJEZjgKLC0zZEZJVaEJC3w6QpNj-nc5d5dgF0TDq_6T0GvTaoN_UZGBgYioGTd0wXHpw0Trzc0VQrN5O3yBYjnhsbwSWlhHlClSAbV_CCy2qUAyDOrXBGmOlIYN8YZ_eJe-wIYioISd9dd0h5rbTSjtMqpX8fDoRZv0jFraVDOk0eMwiGM_TKhsFfR3sx0samCt7k3nCTseLeufCxRUkBZmeoG7o0NrZ0tbTrUoS9XJX_PDK3v9u-Z1LqjmJe7nERG55gXQer-_a5yWn-LKWooAYFW3iLwZEpvAxQF_VtW2xoCkrj5BD9UOnotj6emHmK76oURrSd3waQ_EWmnwf86dSXPQiljp41jHt95V7jyN5P4my-ogotTKxoGA"
```

### Basic Authentication

While we recommend using either Bearer or Cookie authentication with a JSON
Web Token you obtained from the API, the API also supports using API keys as
credentials through [Basic Authentication](https://datatracker.ietf.org/doc/html/rfc7617).

In this scheme, your API Key serves as the username, and the API key's secret as the password.
You should construct the Authorization header to hold the base-64 encoded value of `username:password` prefixed by `Basic `.

An example JSON representation of the headers would look like this:
```json title="Basic Authentication"
{
  "Authorization": "Basic MDFjNmJmMmEtZDBlYy00OWU4LTgwOTctOTNmOTZhYmNjZWQyOmU4YjZkZGIzZTExYzIyNjAwMzYzYzZjNDJjODQzYzM3MTRhM2M0YmI4YWZkMGRmMmUyYWVjOTExNWExYWNmZDEzMjEwMzRhMTVlZWI3ZWNiZDJiNzIwN2M2YzIyODYxOQ=="
}
```

Here too, you can send this header in curl:

```
curl -H "Authorization": "Basic MDFjNmJmMmEtZDBlYy00OWU4LTgwOTctOTNmOTZhYmNjZWQyOmU4YjZkZGIzZTExYzIyNjAwMzYzYzZjNDJjODQzYzM3MTRhM2M0YmI4YWZkMGRmMmUyYWVjOTExNWExYWNmZDEzMjEwMzRhMTVlZWI3ZWNiZDJiNzIwN2M2YzIyODYxOQ==" https://example.morio.it/docker/containers
```

Although for Basic Authentication, curl supports the `-u` flag to pass username:password directly, no need to base-64 encode anything:

```
curl -u "apikey:apisecret" https://example.morio.it/docker/containers
```

### When to (not) use Basic Authentication

While Basic Authentication is easier -- no need to login to request a token -- it is also an order of magniture slower then Bearer or Cookie Authentication..

That is because both Bearer and Cookie authentication send the JSON Web Token. [As we saw above](#json-web-token) the token contains a payload the has everything we need to make a decision about whether or not to grant access. The only thing to do is verify the cryptographic signature of the token.

Compare that to a Basic Authentication request where we need to reach out to the database to lookup the API key, and then cryptographically verify that its credentials are correct.

This round-trip to the database adds significant delay. Perhaps barely noticeable to us humans, but it is on order or magnitude slower to use Basic Authentication.

So as a rule of thumb we recommend that:

- Do not use Basic AUthetnication for more than 3 API requests in a row.
- If you need to make more than 3 API requests, use [the `/login` endpoint](/oas-api#tag/authentication/paths/~1login/post) to grab a JSON Web Token instead, and use either Bearer or Cookie authentication for subsequent API requests.

### Token expiry and renewal

The tokens issued by the API expire. Their expiry is set in [the `MORIO_API_JWT_EXPIRY` preset](/docs/reference/presets/morio_api_jwt_expiry/) which has a default value of `12h`, or 12 hours.

At any time prior to the token's expiry, you can get a new token from [the `/token` endpoint](/oas-api#tag/authentication/paths/~1token/get) to reset the clock on your token expiry.

## API Dependencies

The Morio Management API relies on [the Core service](/docs/guides/services/core) to bootstrap itself, and on [the proxy service](/docs/guides/services/proxy) to act as a reverse proxy.

So any problem with the core or proxy services will also impact the API service.
