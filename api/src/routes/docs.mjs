import redoc from 'redoc-express'
import { spec } from '../../openapi/index.mjs'
import { utils } from '../lib/utils.mjs'

/**
 * This method adds the authentication endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Publish the OpenAPI Specification as JSON
   */
  app.get('/docs/openapi.json', (req, res) => res.send(spec))

  /*
   * Publish the docs with Redoc
   */
  app.get(
    '/docs/',
    redoc({
      title: spec.info.title,
      specUrl: `${utils.getPreset('MORIO_API_PREFIX')}/docs/openapi.json`,
      redocOptions: {
        theme: {
          colors: {
            primary: {
              main: '#1b88a2',
            },
          },
        },
      },
    })
  )
}
