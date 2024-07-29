import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { Joi, uuid } from '#shared/schema'
import { response, errorResponse, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

/*
  app.post(`/setup`, Core.setup)
  app.post(`/settings`, rbac.operator, Core.deploy)

*/

export default (api, utils) => {
  const shared = { tags: ['settings'] }
  api.tag('settings', 'Endpoints related to Morio settings')

  api.post('/deploy', {
    tags: ['settings', 'anonymous'],
    summary: `Deploy initial Morio settings`,
    description: `This will deploy the initial Morio settings. Or rather, it will ask Morio Core to do so after validation.

This endpoint does not require authentication. However, it is only available in ephemeral Mode.
In other words, once settings are deployed, this endpoint becomes unavailable.`,
    requestBody: {
      description: 'The Morio settings to deploy',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          examples: formatResponseExamples(examples.obj.settings),
        }
      }
    },
    responses: {
      // TODO
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.ephemeral.required`,
      ])
    },
  })
  api.get('/settings', {
    ...shared,
    summary: `Get the current Morio settings`,
    description: `Returns the current settings.

Note that Morio will encrypt all secrets and remove them from the settings. So this endpoint returns data that is safe to backup.`,
    responses: {
      200: response('Morio settings', examples.res.settingsSanitized),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.get('/presets', {
    ...shared,
    summary: `Get the current Morio presets`,
    description: `Returns the current presets.`,
    responses: {
      200: response('Morio presets', examples.res.presets),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.get('/reconfigure', {
    ...shared,
    summary: `Triggers a reconfigure event on the API`,
    description: `This will cause the API to re-initialize itself, including reaching out the Morio Core to re-load the settings.

This is an internal route that is exposed to allow for troubleshooting. You probably don't want to use this.`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.post('/settings', {
    ...shared,
    summary: `Apply new Morio settings`,
    description: `This will take a full set of new Morio settings and, after validation, pass them to core to be applied.

Note that this endpoint requires you to post the full settings, so when making updates, make sure to leave nothing behind.`,
    requestBody: {
      description: 'The new Morio settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          example: examples.res.settingsSanitized,
        }
      }
    },
    responses: {
      // TODO
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.account.exists',
        `morio.api.account.state.invalid`,
      ])
    },
  })

}

