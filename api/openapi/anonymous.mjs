import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse } from './index.mjs'


export default (api, utils) => {
  const shared = { tags: ['anonymous'] }
  api.tag('anonymous', 'Endpoints that do not require authentication')

  api.get('/ca/certificates', {
    ...shared,
    summary: `Get the certificates from the Morio Certificate Authoritiy (CA)`,
    description: `Returns the root and intermediate certificates of the Morio CA, along with the root certificate's fingerprint.`,
    responses: {
      200: response('Certificate data', examples.cacerts),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/downloads', {
    ...shared,
    summary: `Get the list of downloads that are available`,
    description: `Returns a list of files in the download folder that can be downloaded from the API`,
    responses: {
      200: response('List of files', examples.downloads),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/idps', {
    ...shared,
    summary: `Get the list of available identity providers`,
    description: `Returns information about the available identity providers (IDPs). Useful for frontend integration.`,
    responses: {
      200: response('List of IDPs', examples.idps),
    },
  })

  api.get('/jwks', {
    ...shared,
    summary: `Get the JSON Web Key Set (JWKS) of Morio`,
    description: `Returns information to verify the JSON Web Tokens (JWT) were issued by this Morio deployment. Useful for integration with exteral services. See [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)`,
    responses: {
      200: response('JWKS data', examples.jwks),
    },
  })

  api.get('/status', {
    ...shared,
    summary: `Get the current status of Morio`,
    description: `Returns information about how Morio is doing. Useful for monitoring.`,
    responses: {
      200: {
        description: 'Morio status',
        content: {
          'application/json': {
            //schema: j2s(schema['res.status']).swagger,
            examples: {
              'Normal Mode': { value: examples.status.normal },
              'Ephemeral Mode': { value: examples.status.ephemeral },
            },
          },
        },
      },
      ...errorResponse(`morio.api.core.status.503`),
    },
  })

  api.get('/up', {
    ...shared,
    summary: `Quick check to verify the API is up`,
    description: `Returns status code 204 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    responses: {
      204: { description: 'No response body' }
    },
  })

  api.post('/validate/settings', {
    ...shared,
    summary: `Validates Morio settings`,
    description: `Returns status code 200 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger
        }
      }
    },
    responses: {
      200: response('Validation report', examples.validateSettings),
      ...errorResponse(`morio.api.schema.violation`),
    },
  })

}

const examples = {
  status: {
    ephemeral: {"info":{"about":"Morio Management API","name":"@morio/api","production":false,"version":"0.2.0"},"state":{"ephemeral":true,"uptime":3,"start_time":1722172656804,"reload_count":1,"config_resolved":true,"settings_serial":0},"core":{"info":{"about":"Morio Core","name":"@morio/core","production":false,"version":"0.2.0"},"status":{"cluster":{"code":2,"color":"amber","time":1722172618398,"msg":"Morio is resolving the configuration"}},"nodes":{},"node":{"uptime":42,"ephemeral":true,"ephemeral_uuid":"a06cc2c9-c007-4956-a58a-4e39c22456e9","reconfigure_count":1,"config_resolved":true,"settings_serial":0}}},
    normal: {"info":{"about":"Morio Management API","name":"@morio/api","production":false,"version":"0.2.0"},"state":{"ephemeral":false,"uptime":40,"start_time":1722172247272,"reload_count":1,"config_resolved":true,"settings_serial":1722159008876},"core":{"info":{"about":"Morio Core","name":"@morio/core","production":false,"version":"0.2.0"},"status":{"cluster":{"code":0,"color":"green","time":1722172286908,"updated":1722172286908,"leader_serial":1,"leading":true,"msg":"Everything is ok"},"nodes":{"morio-node1.example.morio.it":{"api":0,"broker":0,"db":0,"ca":0,"proxy":0,"console":0,"ui":0}}},"nodes":{"e07ffebc-eef0-45c0-86a2-f01fa752a1da":{"fqdn":"morio-node1.example.morio.it","hostname":"morio-node1","ip":"10.1.1.175","serial":1,"uuid":"e07ffebc-eef0-45c0-86a2-f01fa752a1da","settings":1722159008876}},"node":{"uptime":76,"cluster":"78658a7d-0c2a-46a2-a960-0f35384bdf29","node":"e07ffebc-eef0-45c0-86a2-f01fa752a1da","node_serial":1,"ephemeral":false,"reconfigure_count":1,"config_resolved":true,"settings_serial":1722159008876}}},
  },
  cacerts: {"root_fingerprint":"50a3270a0988610145659cfb190121d1fcfd50141b953a783f354d840ad3bf9e","root_certificate":"-----BEGIN CERTIFICATE-----\r\nMIIGdDCCBFygAwIBAgIBATANBgkqhkiG9w0BAQsFADCBnzELMAkGA1UEBhMCQkUx\r\nETAPBgNVBAgTCEJydXNzZWxzMREwDwYDVQQHEwhCcnVzc2VsczEZMBcGA1UEChMQ\r\nRW5naW5lZXJpbmcgVGVhbTEkMCIGA1UECxMbTW9yaW8gU3RhbmRhbG9uZSBTd2Fy\r\nbSBUZXN0MSkwJwYDVQQDEyBNb3JpbyBSb290IENlcnRpZmljYXRlIEF1dGhvcml0\r\neTAeFw0yNDA3MjgxMzE4MzZaFw00NDA3MjgxMzE4MzZaMIGfMQswCQYDVQQGEwJC\r\nRTERMA8GA1UECBMIQnJ1c3NlbHMxETAPBgNVBAcTCEJydXNzZWxzMRkwFwYDVQQK\r\nExBFbmdpbmVlcmluZyBUZWFtMSQwIgYDVQQLExtNb3JpbyBTdGFuZGFsb25lIFN3\r\nYXJtIFRlc3QxKTAnBgNVBAMTIE1vcmlvIFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9y\r\naXR5MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAkK3oHb9U0thYdq2F\r\niOtXhsxIp+omgEczcYL6fE5B+y2Qy7vzWvOr1l9kZTPN6FkYlo0idXWa4RO9SgQ9\r\nBoOqR+NaOvYRvn836l9ohGztvPAfxdxB+BGoHcd3KFgeD8veedKaCTgeVWNUQMUK\r\nHPR3q8HQXs1bycJ15j9ktmhtCKnZvFJUXZrOskgWdE+0pXI8rfrBdXB2z9WrN9dr\r\n32bxLfsB+JycO1OLs/dJpkIyj1+nbAzdW6KpiDMTq9DJSQgGKbgYoz73cD6uSbnh\r\n+sLhSvpUy7Kz5O+L5Ne+q4LNI4Dt5St4FGBljDWxV1Oar2MRyhwbdeIb4yunIpgY\r\nr/iD4+vCDSEiIxwcS9H8n5qyHbhMO8Nh9zUsGsomBcB+UlPbdB3I0M1veLB2Eb3t\r\nJ/qf7mzdN4yO2i5gP3irvF6BYM4Yb1NNvBKioyWYsQYAl+xOWI7vLXB/1IKs3Xux\r\nFnKa8lTuo1PORwS8g+pXUMX2Otc6Ucf0r58YoZrvAFUQRfdf9uk1jAKGXLkhrWva\r\no+ZUDrB9VnjNUrCr6DoTam7mDRIlgkCpDje/alW5gLh5++l2gcG4Eht1I9L/O+Ug\r\nJptJ3gyrWm8RknXFqT3LsPwRYFFewjxfS0bsww/5+O5A3TKu/PKyINazT5SRYNI4\r\noXOSebu0b9WHMkYVqrmxoTGgd/sCAwEAAaOBuDCBtTAMBgNVHRMEBTADAQH/MAsG\r\nA1UdDwQEAwIC9DA7BgNVHSUENDAyBggrBgEFBQcDAQYIKwYBBQUHAwIGCCsGAQUF\r\nBwMDBggrBgEFBQcDBAYIKwYBBQUHAwgwEQYJYIZIAYb4QgEBBAQDAgD3MB0GA1Ud\r\nDgQWBBRLAieUVRyHBPxbwRQ05LyL7xSvNTApBgNVHREEIjAggh5wb2MtbW9yaW8t\r\nbm9kZTEuY2VydC5ldXJvcGEuZXUwDQYJKoZIhvcNAQELBQADggIBAHfuhwc9awm+\r\nnZy7l8iviAoFqo3ja6yt/efx9KoQOCWP0q7TX7YAqWs8JQGV1DxFE94j3flgSxx5\r\nEeNs1p7qFHpJ1wGoWbTS8X/ytAVjKQEzfzSNSIEfK5O7G9rKWnpMjI6ZnuAbB7MU\r\nA1h6vrA2373qj7VFJfupj6qanZ8/WmhEU6dfwL1Mp4trwY7g40FfQOq8+YyqWyU0\r\nZdO7DUJd+bO8KGV6l7z8U9CyVN3X4hAvpHZ4rhD5Kabq0o6pA3GaQaSWPJfAxCNF\r\n1uWR3rLH2aK68pKAUrGNXRibyhrWIuX5t/WTub9zZw7FMk01YSFwXnl46MHFTt/r\r\nZWJVVITPCLjAHJaBH7WX8KXAORuE1Lqm9Ynapj0+B8c3nGC4Th+BiHorB3+CF799\r\nEpRjHsNXQWLRgP09gl1g/yp4GYbImUN2tjkyb7OftF/F/AEIozFGeXK0ewk+gZKt\r\nlYyqKzOjNbL7pDVh3NWQlGV9ky6rr2XWvYFzb3vFkH5MNWMHE5kCpjuAU/tOzmpG\r\n55TpUcT2BY4rTM8mObGNiPu4Vy9VqCaTy+mUlyRHlUZIBaZTxqNmjHrQXDj/B9s9\r\n0ekS8ikHr7A3mYdbZrCi0dEfQTs9seiWfid59I4W7R7/J0czJHusKkpM/GE5lFcg\r\noUyCyR375Emn80zazBRiKvAey+gT1bPD\r\n-----END CERTIFICATE-----\r\n","intermediate_certificate":"-----BEGIN CERTIFICATE-----\r\nMIIGfDCCBGSgAwIBAgIBATANBgkqhkiG9w0BAQsFADCBnzELMAkGA1UEBhMCQkUx\r\nETAPBgNVBAgTCEJydXNzZWxzMREwDwYDVQQHEwhCcnVzc2VsczEZMBcGA1UEChMQ\r\nRW5naW5lZXJpbmcgVGVhbTEkMCIGA1UECxMbTW9yaW8gU3RhbmRhbG9uZSBTd2Fy\r\nbSBUZXN0MSkwJwYDVQQDEyBNb3JpbyBSb290IENlcnRpZmljYXRlIEF1dGhvcml0\r\neTAeFw0yNDA3MjgxMzE4NDFaFw0yOTA3MjgxMzE4NDFaMIGnMQswCQYDVQQGEwJC\r\nRTERMA8GA1UECBMIQnJ1c3NlbHMxETAPBgNVBAcTCEJydXNzZWxzMRkwFwYDVQQK\r\nExBFbmdpbmVlcmluZyBUZWFtMSQwIgYDVQQLExtNb3JpbyBTdGFuZGFsb25lIFN3\r\nYXJtIFRlc3QxMTAvBgNVBAMTKE1vcmlvIEludGVybWVkaWF0ZSBDZXJ0aWZpY2F0\r\nZSBBdXRob3JpdHkwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDEbgzx\r\n0dF680J70HM+CwPDQM7owZf/nQnvHkxelrNOE1JE845kMbO+LC07WX8C1anizDJQ\r\npHiMzMWuCdziqUUSl19aAUfrP53ei3IvIC3R9mXusKLnrTEXauC7er1h2vsoz9F5\r\nmULW7Lsf/mdKu6MsXalJyDpWLBtZz3zznzoTd/rwKnFUnauy/rkTuwDqzRho1/89\r\n50sNdUgSQ14srXGxQmXyAeH9PZk3c40mLHmSYqJhP1H6O0t/snXbfO4s+5UDaTiF\r\n+3ANjeeJDUeDtXxg2hGiCPssrWeCGr331Jy4XU3nwaTGH7EmLep4IjE1+7qcOSl3\r\nkOWex7CmY991/PZSneHE0w4YAmudZTfHl7lA2RpVxFMkbIcbx7lMll/zfrvqax6W\r\nx7TIuqYoPwofr8hwxiKbxVCqW0UudxRrJXZLMlTavXIxVfEOmR7frfl/CmiyybwG\r\nzLqAsILof8azYWjqR+hwUKrj/UR05fiQfJmC8WGfGXWqM/YKUpIheG+FWs6jKHkm\r\nNcmANp+w6ucTbV++1vdhj8vLmjELFf9JRptSZxMQpUA2gVfF2Hbn+jyDQyhFSElk\r\n2K0KKQRHqMYRquRVZCHWZnaLyESh5bQGpt0q3+ZqlEfSM57h8eCmmd+ia1aVDeWU\r\nGlpe3mJPtNef9HBojkytvXqcQOOw0RDI6JBnuQIDAQABo4G4MIG1MAwGA1UdEwQF\r\nMAMBAf8wCwYDVR0PBAQDAgL0MDsGA1UdJQQ0MDIGCCsGAQUFBwMBBggrBgEFBQcD\r\nAgYIKwYBBQUHAwMGCCsGAQUFBwMEBggrBgEFBQcDCDARBglghkgBhvhCAQEEBAMC\r\nAPcwHQYDVR0OBBYEFEsCJ5RVHIcE/FvBFDTkvIvvFK81MCkGA1UdEQQiMCCCHnBv\r\nYy1tb3Jpby1ub2RlMS5jZXJ0LmV1cm9wYS5ldTANBgkqhkiG9w0BAQsFAAOCAgEA\r\nTN9kHQBILMqCQSpYINywlmnchGTsqzvisE9p3IzqDWNMuQybwAt6/3LetE1SomYc\r\nYmh2fS8MmAHs+xr7ZfldTSVBUMXj+R2p176d3AmToR4PQ2qFdLGT+JoMOk9qsMG6\r\nNyozmLKvT1TIAt2pwjGSfX0GLSy2RS+mUpxUHpaDKLozTk1YJZJnAzX9l6SJz+m/\r\n77XpmTxMTKCQY0WsKLtohlDAs9lrm9MAJir7XKbMyiHE0L4OiW1pgozxvPxeTBUz\r\ngEXz4laHvrbN/rRwzqdlZ1XFzgjuOT1Tfkn8fzbjqZVqs0muyTqsftkKUyi3rgY8\r\nH1RKqt4r+h86XSXTR3/M3Z7IZYQ9ts0qDhPyrya9S9V7ZPO7GWKcMIA2JhjAn5/0\r\nvcvrXFoE6bnXagxT6p+lUJqUycecpDgN4TFcRCTB/rvC7H6Qi7v7z3OU2kjYQp7n\r\nQjiAYmeXwoqB27hlBjKOpS3dgX34/HjhYJJ6JSZ5r89ZhSgQraIvNpf8HamrKtTz\r\nVsipAq4Ol2rkMwuiIRZGfE3eFppO4aWGs6nIwwrI00ttO241a8MVv95ruPFoULLS\r\nZJ3dD2kDgEZ3F9pDlJyty0T4PPNkwu35ysldWPXce9zy/7AFmxujMnd4bB+0tO0t\r\nDmghEeLnxtbFVX9qGQYM4a07Y7s7jFuIlXeZqMDxHgU=\r\n-----END CERTIFICATE-----\r\n"},
  idps: {"idps":{"apikey":{"id":"apikey","provider":"apikey","label":"API Key","about":false},"mrt":{"id":"mrt","provider":"mrt","about":false},"local":{"id":"local","provider":"local","label":"Morio Account","about":false},"ad":{"id":"ad","provider":"ldap","label":"Active Directory","about":"Morio on-prem Active Directory"}},"ui":{"visibility":{"mrt":"icon","local":"icon","apikey":"icon"},"order":["ad","local","apikey","mrt"]}},
  jwks: {"keys":[{"kty":"RSA","kid":"YEKFMAkSJihz6zIBs6a-gQ9iEOxuljm_A3Xg6mkiAPY","n":"yriNzCVnGQ56dyOVhoPn4J2xlq4_SW6YEoq2FAM1uXtY2FNg1nAtytdY7SKzyuSF1U5sOQ77RmACiXIX-tkuTTPl_kNZQ4udH-c2w01_So9uj9rjDSwvtilHOn4y-l9qYyqBM93jBnjWGFTBNpmDHO4ctVorI6zK1mE7ILDTEpz1lPiZUz22feLOSuCQfnGNJsoU5msSJCiOVtfi37yFQ-ZAQtcJGBe11xRkvjegQJv9UB67tnD3DkRt7FnNDWHJmIcPOyySHJ7CH_ajRZj6_S0BVdlTWNiarKGzTlRCpQCqVFaiu8g6H8ANSoWypIazoOA-iJ3n8VSgvxiVAX1vVzG_Z44Vd8JpEpOWeC36qfX2LNKg0KvUEgbdMt6NB4RUsXVgdIGT02h_RRVmTY5FZCcWtA6pqlJ9sd27f5t0IWAMLJLpUq6WjOVTidUxon7xVGLot26DP3S7KnVS1FHZFsUQn5uQ2kNbzWyr6gha3YbvYk1Ss6bRu9Zzv4mKXaXn-rASvuSHZClPo0k4wEfQ7kWRJgwNe9hbZRh_MGl4VbGhg0TbaPwqYucmffecjrhNEAPsjt5R7_Ukc4lg8y4miPn6QPsGBfNgiGfhdWLy_FXA-Nn2DJqsDJcieNJp0rOUDGRJSj64s8Y1dpOi14ZjErz3x9OZBHk1Nw1NAQ3Z96U","e":"AQAB"}]},
  downloads: ["/downloads/certs","/downloads/certs/root.pem","/downloads/certs/intermediate.pem","/downloads/certs/db.pem","/downloads/certs/console.pem","/downloads/certs/broker.pem"],
  validateSettings: {"valid":true,"deployable":false,"errors":[],"warnings":["Node 1 runs Morio, but is not in ephemeral mode, its settings would be overwritten"],"info":["Settings passed schema validation","Validating node 1: morio-node1.tokyo.morio.it","Node 1 resolves to: 10.123.12.15","Node 1 is reachable over HTTPS"],"validated_settings":{"cluster":{"name":"Morio Standalone Example","broker_nodes":["pmorio-node1.tokyo.morio.it"]},"tokens":{"flags":{"HEADLESS_MORIO":false,"DISABLE_ROOT_TOKEN":false},"secrets":{"AD_PASSWORD":"superSecretPasswordHere"}},"iam":{"providers":{"apikey":{"provider":"apikey","id":"apikey","label":"API Key"},"mrt":{},"local":{"provider":"local","id":"local","label":"Morio Account"},"ad":{"provider":"ldap","id":"ad","about":"Morio on-prem Active Directory","server":{"url":"ldaps://dc1.tokyo.morio.it","bindDN":"CN=morio-ldap,OU=Functional,OU=Ansyco,DC=tokyo,DC=morio,DC=it","bindCredentials":"{{{ AD_PASSWORD }}}","searchBase":"OU=Ansyco,DC=tokyo,DC=morio,DC=it","searchFilter":"(&(objectClass=user)(samaccountname={{username}}))"},"username_field":"samaccountname","label":"Active Directory","rbac":{"user":{"attribute":"samaccountname","regex":"."},"root":{"attribute":"samaccountname","regex":"^(?:jdecock|snidhubhghaill)$"}},"verify_certificate":true}},"ui":{"visibility":{"mrt":"icon","local":"icon","apikey":"icon"},"order":["ad","local","apikey","mrt"]}}}},

}
