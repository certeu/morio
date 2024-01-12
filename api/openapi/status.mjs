import j2s from 'joi-to-swagger'
import { responseSchema } from '../src/schema.mjs'
import { fromEnv } from '#shared/env'

const PREFIX = fromEnv('MORIO_API_PREFIX')

const shared = {
  tags: ['Status'],
}

/*
 * You cannot use a template string as an object key in Javascript.
 * That's because object keys are always coersed into a string. But a template literal
 * can't be coersed as it need to be evaluated first.
 * Arrays however can always be coerced to a string, and a single element array when
 * coersed to a string will just give us that one element.
 *
 * So it's a little hack to ensure we can use dynamic keys and use the prefix
 * that is configured.
 */
export const paths = {
  [`${PREFIX}/status`]: {
    get: {
      ...shared,
      summary: `Returns the Morio status`,
      description: `Returns information about how Morio is doing. Useful for monitoring.`,
      responses: {
        200: {
          description: 'Setup initiated successfully',
          content: {
            'application/json': {
              schema: j2s(responseSchema.status).swagger,
              examples: {
                'Before setup': {
                  value: {
                    name: '@morio/api',
                    about: 'Morio REST API',
                    version: '0.1.0',
                    uptime: '30.7 seconds',
                    uptime_seconds: 30.761,
                    setup: false,
                  },
                },
                'After setup': {
                  value: {
                    fixme: 'Not implemented yet',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  [`${PREFIX}/ca/root`]: {
    get: {
      ...shared,
      summary: `Returns the CA root certificate and fingerprint`,
      description: `Returns the current Morio configuration that is running.`,
      responses: {
        200: {
          description: 'Configuration returned successfully',
          content: {
            'application/json': {
              schema: j2s(responseSchema.status).swagger,
              examples: {
                'Before setup': {
                  value: {}
                },
                'After setup': {
                  value: {
                    fixme: 'Not implemented yet',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  [`${PREFIX}/configs/current`]: {
    get: {
      ...shared,
      summary: `Returns the current Morio configuration`,
      description: `Returns the current Morio configuration that is running.`,
      responses: {
        200: {
          description: 'Configuration returned successfully',
          content: {
            'application/json': {
              schema: j2s(responseSchema.status).swagger,
              examples: {
                'Before setup': {
                  value: {}
                },
                'After setup': {
                  value: {
                    fixme: 'Not implemented yet',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
