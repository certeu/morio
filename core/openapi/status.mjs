import { response } from './index.mjs'
import { examples } from '#shared/openapi'

export default (api) => {
  const shared = { tags: ['status'] }
  api.tag('status', 'Endpoints related to the Morio status')

  api.get('/status', {
    ...shared,
    summary: `Get status`,
    description: `Returns information about the current status of Morio core.`,
    responses: {
      200: response('Morio Core Status', examples.res.status),
    },
  })

  api.get('/reload', {
    ...shared,
    summary: `Reload API data`,
    description: `This will return all the data required to bootstrap the Morio Management API, including the settings, presets, and keys.`,
    responses: {
      200: response('API bootstrap data', examples.res.reload),
    },
  })
}
