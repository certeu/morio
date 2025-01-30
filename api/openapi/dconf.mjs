import { response, errorResponses, security } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['dconf'] }
  api.tag('dconf', "Endpoints for Morio's dynamic configuration")

  api.get('/dconf/flags', {
    ...shared,
    security,
    operationId: 'readFlags',
    summary: `Retrieve the current values for all feature flags`,
    description: `This loads all feature flags and their current setting.

    Since only non-default feature flags are part of the setting, this endpoint is what enables the UI to generate the settings wizard for all available feature flags.`,
    responses: {
      200: response({
        desc: 'The feature flags and their current setting',
        example: examples.res.flags,
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/dconf/tap', {
    ...shared,
    security,
    operationId: 'readTap',
    summary: `Retrieve the dynamic tap settings for stream processors`,
    description: `Since stream processors are dynamically loaded, and can have their own settings, this endpoint allows to retrieve these settings exposed by any loaded stream processors.

This endpoint is what enables the UI to generate the settings wizard for the loaded stream processors.`,
    responses: {
      200: response({
        desc: 'The tap settings',
        example: examples.res.tap,
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
