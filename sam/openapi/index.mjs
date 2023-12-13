import pkg from '../package.json' assert { type: 'json' }
import { paths as action } from './action.mjs'
import { paths as status } from './status.mjs'

const description = `
## What am I looking at?  🤔
This is reference documentation for the Morio SAM REST API.
It is auto-generated from this API's OpenAPI v3 specification.

To learn more about morio, visit [the GitHub repository](https://github.com/certeu/morio/).
`

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Morio SAM',
    description,
    termsOfService: 'FIXME: Do we need terms of service?',
    contact: {
      name: 'CERT-EU',
      email: 'morio@cert.europa.eu',
    },
    license: {
      name: 'FIXME: What license?',
      url: 'https://cert.europa.eu'
    },
    version: pkg.version,
  },
  externalDocs: {
    description: 'MORIO documentation on GitHub',
    url: 'https://gihub.com/certeu/morio/',
  },
  tags: [
    {
      name: 'Action',
      description: 'Trigger system actions'
    },
    {
      name: 'Status',
      description: 'Monitor a MORIO instance or cluster'
    }
  ],

  components: {
  },
  paths: {
    ...action,
    ...status,
  },
}
