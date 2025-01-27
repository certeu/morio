import { response, errorResponses, security } from './index.mjs'

export default function (api) {
  const shared = { tags: ['fixme'] }
  api.tag('fixme', "Endpoints to manage Morio's inventory (FIXME: document these)")

  api.get('/inventory/stats', {
    ...shared,
    security,
    operationId: 'inventoryStats',
    summary: `Retrieve statistics about the Morio inventory`,
    description: `FIXME: This and other inventory endpoints are not yet documented since it's a work in progress.`,
    responses: {
      200: response({
        desc: 'The inventory stats',
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
