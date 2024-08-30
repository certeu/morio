import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponses } from './index.mjs'
import { examples } from '#shared/openapi'

export default (api) => {
  const shared = { tags: ['client packages'] }
  api.tag('client packages', 'Endpoints related to client packages')

  api.post('/pkgs/clients/deb/build', {
    ...shared,
    summary: `Build a .deb package`,
    description: `This will trigger the build of a .deb client package.

Note that this will start an ephemeral container to start the build. This API endpoint will not wait for the build to complete before retuning.`,
    requestBody: {
      description: 'The configuration for building the `.deb` client package',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.pkg.build.deb']).swagger,
          example: examples.req.pkgBuild.deb,
        },
      },
    },
    responses: {
      200: response('Confirmation data', examples.res.pkgBuild.deb),
      ...errorResponses([`morio.core.schema.violation`]),
    },
  })

  api.get('/pkgs/clients/deb/defaults', {
    ...shared,
    summary: `Get .deb package defaults`,
    description: `This will return the default values to create a new .deb client package.

Note that configuration of a \`.deb\`package needs to be correct or the package will not function.
You can adapt these defaults (that's why we provide them), but should [consult the Debian documnentation on packaging](https://wiki.debian.org/Packaging).`,
    responses: {
      200: response('Debian client package defaults', examples.res.pkgDefaults.deb),
    },
  })
}
