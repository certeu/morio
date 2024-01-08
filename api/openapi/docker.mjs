import j2s from 'joi-to-swagger'
import { requestSchema, responseSchema, errorsSchema } from '../src/schema.mjs'
import { fromEnv } from '#shared/env'
// Examples of responses
import dockerAllContainersExample from './examples/docker-all-containers.json' assert { type: 'json' }
import dockerRunningContainersExample from './examples/docker-running-containers.json' assert { type: 'json' }
import dockerDfExample from './examples/docker-df.json' assert { type: 'json' }
import dockerInfoExample from './examples/docker-info.json' assert { type: 'json' }
import dockerImagesExample from './examples/docker-images.json' assert { type: 'json' }
import dockerNetworksExample from './examples/docker-networks.json' assert { type: 'json' }

const PREFIX = fromEnv('MORIO_API_PREFIX')
const shared = { tags: ['Docker'] }

const responses = (example) => ({
  200: {
    description: 'Data returned by the Docker daemon',
    content: { 'application/json': { example } },
  },
})

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
  [`${PREFIX}/docker/all-containers`]: {
    get: {
      ...shared,
      summary: `Returns a list of all Docker containers`,
      description: `This returns a list of all Docker containers.`,
      responses: responses(dockerAllContainersExample),
    },
  },
  [`${PREFIX}/docker/containers`]: {
    get: {
      ...shared,
      summary: `Returns a list of running Docker containers`,
      description: `This returns a list of Docker containers that are currently running.`,
      responses: responses(dockerRunningContainersExample),
    },
  },
  [`${PREFIX}/docker/df`]: {
    get: {
      ...shared,
      summary: `Returns storage info from the Docker daemon`,
      description: `The runs the <code>df</code> command on the Docker daemon and returns its output.`,
      responses: responses(dockerDfExample),
    },
  },
  [`${PREFIX}/docker/images`]: {
    get: {
      ...shared,
      summary: `Returns a list of Docker images`,
      description: `This returns a list of Docker images that are locally available.`,
      responses: responses(dockerInfoExample),
    },
  },
  [`${PREFIX}/docker/info`]: {
    get: {
      ...shared,
      summary: `Returns info from the Docker daemon`,
      description: `The runs the <code>inspect</code> command on the Docker daemon and returns its output.`,
      responses: responses(dockerInfoExample),
    },
  },
}
