import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from '#shared/openapi'

export default (api) => {
  const shared = { tags: ['settings'] }
  api.tag('settings', 'Endpoints related to the Morio settings')

  api.get('/settings', {
    ...shared,
    summary: `Get the current Morio settings`,
    description: `Returns the current settings.

Note that Morio will encrypt all secrets and remove them from the settings. So this endpoint returns data that is safe to backup.`,
    responses: {
      200: response('Morio settings', examples.res.settingsSanitized),
    },
  })

  api.post('/settings', {
    ...shared,
    summary: `Apply new Morio settings`,
    description: `This will take a full set of new Morio settings and, after validation, apply them.

Note that this endpoint requires you to post the full settings, so when making updates, make sure to leave nothing behind.`,
    requestBody: {
      description: 'The new Morio settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.settings.setup']).swagger,
          examples: formatResponseExamples(examples.obj.settings),
        },
      },
    },
    responses: {
      ...errorResponses([
        `morio.core.schema.violation`,
      ]),
    },
  })

  api.post('/setup', {
    ...shared,
    summary: `Initial setup of Morio`,
    description: `This will set up Morio with the provided initial settings.

This endpoint is only available in ephemeral Mode.
In other words, once Morio is set up, this endpoint becomes unavailable.`,
    requestBody: {
      description: 'The Morio settings to use for the intial setup',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.settings.setup']).swagger,
          examples: formatResponseExamples(examples.obj.settings),
        },
      },
    },
    responses: {
      200: response('Setup result', examples.res.setup),
      ...errorResponses([`morio.core.schema.violation`, `morio.core.ephemeral.required`]),
    },
  })
}
