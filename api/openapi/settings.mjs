import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['settings'] }
  api.tag('settings', 'Endpoints related to Morio settings')

  api.post('/setup', {
    operationId: 'setup',
    tags: ['settings', 'anonymous'],
    summary: `Set up Morio`,
    description: `This will handle the initial setup of Morio. Or rather, it will ask Morio Core to do so after validation.

This endpoint does not require authentication. However, it is only available in ephemeral Mode.
In other words, once Morio is set up, this endpoint becomes unavailable.`,
    requestBody: {
      description: 'The Morio settings to use for the initial setup',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          examples: formatResponseExamples(examples.obj.settings),
        },
      },
    },
    responses: {
      200: response({
        desc: 'Setup result',
        example: examples.res.setup,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.ephemeral.required`,
        `morio.api.authentication.required`,
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.post('/preseed', {
    operationId: 'preseed',
    tags: ['settings', 'anonymous'],
    summary: `Preseed Morio`,
    description: `This will handle the initial setup of Morio via preseeded settings. Or rather, it will ask Morio Core to do so after validation.

This endpoint does not require authentication. However, it is only available in ephemeral Mode.
In other words, once Morio is set up, this endpoint becomes unavailable.`,
    requestBody: {
      description: 'The Morio preseed settings to use for the initial setup',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.preseed']).swagger,
          examples: formatResponseExamples(examples.obj.preseed),
        },
      },
    },
    responses: {
      200: response({
        desc: 'Setup result',
        example: examples.res.setup,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.ephemeral.required`,
        `morio.api.authentication.required`,
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/settings', {
    operationId: 'getSettings',
    ...shared,
    summary: `Get settings`,
    description: `Returns the current settings.

Note that Morio will encrypt all secrets and remove them from the settings. So this endpoint returns data that is safe to backup.`,
    responses: {
      200: response({
        desc: 'Morio settings',
        example: examples.res.settingsSanitized,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.get('/presets', {
    operationId: 'getPresets',
    ...shared,
    summary: `Get presets`,
    description: `Returns the current presets.`,
    responses: {
      200: response({
        desc: 'Morio presets',
        example: examples.res.presets,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.get('/reload', {
    operationId: 'reload',
    ...shared,
    summary: `Reload the API`,
    description: `This will cause the API to re-initialize itself, including reaching out the Morio Core to re-load the settings.

This is an internal route that is exposed to allow for troubleshooting. You probably don't want to use this.`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.get('/reseed', {
    operationId: 'reseed',
    ...shared,
    summary: `Reseed Morio`,
    description: `This will trigger reseeding of the settings, followed by a (soft) restart of Morio`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.get('/restart', {
    operationId: 'restart',
    ...shared,
    summary: `Restart Morio`,
    description: `This will cause a soft restart of core, re-bootstrapping itself based on the settings on disk.`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.post('/settings', {
    operationId: 'applySettings',
    ...shared,
    summary: `Apply settings`,
    description: `This will take a full set of new Morio settings and, after validation, pass them to core to be applied.

Note that this endpoint requires you to post the full settings, so when making updates, make sure to leave nothing behind.`,
    requestBody: {
      description: 'The new Morio settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          examples: formatResponseExamples(examples.obj.settings),
        },
      },
    },
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([`morio.api.schema.violation`, `morio.api.authentication.required`]),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })
}
