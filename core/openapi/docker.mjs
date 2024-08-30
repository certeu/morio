import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { response, errorResponse } from './index.mjs'

const parameters = [
  {
    in: 'path',
    name: `id`,
    schema: j2s(
      Joi.string().required().description('The ID (or name) of the relevant Docker object')
    ).swagger,
    retuired: true,
    description: 'The ID (or name) of the relevant docker object',
  },
]

const dockerGets = [
  // Simple GETs
  {
    slug: 'allcontainers',
    spread: {
      summary: 'List containers',
      description: `This is a proxy endpoint for the Docker API on the host system that returns list of all containers available on the host system.

To only get the running containers, use the \`/docker/containers\` endpoint instead.`,
    },
    api: {
      title: 'List Containers',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerList',
    },
  },
  {
    slug: 'containers',
    spread: {
      summary: 'List running containers',
      description: `This is a proxy endpoint for the Docker API on the host system that returns the list of containers currently running on the hoste sytem.

To get all containers, use the \`/docker/allcontainers\` endpoint instead.`,
    },
    api: {
      title: 'List Containers',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerList',
    },
  },
  {
    slug: 'df',
    spread: {
      summary: 'Get storage metrics',
      description: `This is a proxy endpoint for the Docker API on the host system that returns information on the used and available storage on the host sytem.

This endpoint is named after the the \`df\` command on Linux.`,
    },
    api: {
      title: 'Get data usage',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/System/operation/SystemDataUsage',
    },
  },
  {
    slug: 'images',
    spread: {
      summary: 'List images',
      description: `This is a proxy endpoint for the Docker API on the host system that returns the list of Docker images available on the host system.`,
    },
    api: {
      title: 'List Images',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Image/operation/ImageList',
    },
  },
  {
    slug: 'info',
    spread: {
      summary: 'Get Docker info',
      description: `This is a proxy endpoint for the Docker API on the host system that returns general information about the Docker daemon on the host system.`,
    },
    api: {
      title: 'Get system information',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/System/operation/SystemInfo',
    },
  },
  {
    slug: 'networks',
    spread: {
      summary: 'List networks',
      description: `This is a proxy endpoint for the Docker API on the host system that returns a list of Docker networks on the host system.`,
    },
    api: {
      title: 'List networks',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Network/operation/NetworkList',
    },
  },
  {
    slug: 'version',
    spread: {
      summary: 'Get Docker version',
      description: `This is a proxy endpoint for the Docker API on the host system that returns information on the version of Docker that is running on the host system.`,
    },
    api: {
      title: 'Get version',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/System/operation/SystemVersion',
    },
  },
  // With parameters
  {
    slug: 'container/:id',
    spread: {
      summary: 'Inspect container',
      description: `This is a proxy endpoint for the Docker API on the host system that returns information on the container with the ID passed as a parameter in the URL.

This endpoint is equivalent to running the \`inspect\` command on a container in the Docker CLI.

Note that Docker accepts an ID or (unambigious) name as input.
`,
      parameters,
    },
    api: {
      title: 'Inspect a container',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerInspect/',
    },
  },
  {
    slug: 'container/:id/logs',
    spread: {
      summary: 'Get logs',
      description: `This is a proxy endpoint for the Docker API on the host system that returns logs from the container with the ID passed as a parameter in the URL.

This endpoint is equivalent to running the \`logs\` command on a container in the Docker CLI.

Note that Docker accepts an ID or (unambigious) name as input.
`,
      parameters,
    },
    api: {
      title: 'Get container logs',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerInspect',
    },
  },
  {
    slug: 'container/:id/stats',
    spread: {
      summary: 'Get usage stats',
      description: `This is a proxy endpoint for the Docker API on the host system that returns stats based on resource usage from the container with the ID passed as a parameter in the URL.

These stats come from a container'se \`inspect\` command in the Docker CLI.

Note that Docker accepts an ID or (unambigious) name as input.
`,
      parameters,
    },
    api: {
      title: 'Get container stats based on resource usages',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerInspect',
    },
  },
  {
    slug: 'image/:id',
    spread: {
      summary: 'Inspect image',
      description: `This is a proxy endpoint for the Docker API on the host system that returns information on the image with the ID passed as a parameter in the URL.

This endpoint is equivalent to running the \`inspect\` command on an image in the Docker CLI.

Note that Docker accepts an ID or (unambigious) name as input.
`,
      parameters,
    },
    api: {
      title: 'Inspect an image',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerInspect',
    },
  },
  {
    slug: 'networks/:id',
    spread: {
      summary: 'Inspect network',
      description: `This is a proxy endpoint for the Docker API on the host system that returns information on the network with the ID passed as a parameter in the URL.

This endpoint is equivalent to running the \`inspect\` command on a network in the Docker CLI.

Note that Docker accepts an ID or (unambigious) name as input.
`,
      parameters,
    },
    api: {
      title: 'Inspect a network',
      url: 'https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerInspect',
    },
  },
]

export default (api) => {
  const shared = { tags: ['docker'] }
  api.tag('docker', 'Endpoints that leverage the Docker daemon API')

  for (const d of dockerGets) {
    api.get(`/docker/${d.slug}`, {
      ...shared,
      ...d.spread,
      responses: {
        200: response(`[See **${d.api.title}** in the Docker API docs](${d.api.url}) `),
        ...errorResponse(`morio.core.ephemeral.prohibited`),
      },
    })
  }

  for (const action of ['Kill', 'Pause', 'Restart', 'Start', 'Stop', 'Unpause']) {
    api.put(`/docker/containers/:id/${action.toLowerCase()}`, {
      ...shared,
      summary: `${action} container`,
      description: `This changes, or attempts to change, the container state by issuing a \`${action.toLowerCase()}\` command.`,
      responses: {
        200: response(
          `[See **${action} a container** in the Docker API docs](https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/Container${action}) `
        ),
        ...errorResponse(`morio.core.ephemeral.prohibited`),
      },
    })
  }
}
