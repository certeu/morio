import pkg from '../package.json' assert { type: 'json' }
import { paths as setup } from './setup.mjs'

const description = `
## What am I looking at?  🤔
This is reference documentation of the morio API.
It is auto-generated from this API's OpenAPI v3 specification.

To learn more about morio, visit [the GitHub repository](https://github.com/certeu/morio/).
`

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'MORIO REST API',
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
      name: 'Setup',
      description: 'Initial setup of a MORIO instance or cluster'
    }
  ],

  components: {
  },
  paths: {
    ...setup,
  },
}
