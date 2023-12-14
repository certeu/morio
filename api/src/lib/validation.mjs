import { requestSchema as schema, morioSchema } from '../schema.mjs'
import { resolveHost, testUrl } from '@morio/lib/network'
import get from 'lodash.get'

/*
 * Validation helpers
 */

/**
 * Validates input
 *
 * The Joi library throws when validation fails
 * NodeJS does not like it (at all) when you throw in async code
 * We could validate in sync, but NodeJS is single-threaded so if we
 * can async it, we should.
 *
 * This is why this wrapper function provides a try...catch block for validation
 *
 * @param {string} targetPath - The location of the target object in the schema, in dot notation
 * @param {object] input - The input to validate
 * @return {object} valid - The result of the Joi validation
 */
export const validate = async (targetPath, input) => {
  const target = get(schema, targetPath)
  let valid
  try {
    valid = await target.validateAsync(input)
  } catch (err) {
    return [false, err]
  }

  return [valid, null]
}

/**
 * Validates MORIO configuration
 *
 * This will not catch all problems, but it should at least catch some common
 * configuration issues, in particular for people writing their own config.
 *
 * @param {object} newConfig - The configuration to validate
 * @param {object} tools - The various tools and current config from the controller
 * @retrun {object} report - An object detailing the results of the validation
 */
export const validateConfiguration = async (newConfig, tools) => {
  /*
   * Set up the report skeleton that we will return
   */
  const report = {
    valid: false,
    deployable: false,
    errors: [],
    warnings: [],
    info: [],
  }

  /*
   * We define this here to keep things DRY
   */
  const abort = () =>
    report.warnings.push(`Validation was terminated before completion due to errors`)

  /*
   * Validate config against the config schema
   */
  let config
  try {
    config = await morioSchema.validateAsync(newConfig)
  } catch (err) {
    /*
     * Validate failed, bail out here
     */
    report.errors.push(`Configuration did not pass schema validation`)
    for (const msg of err.details) report.errors.push(msg.message)
    abort()

    return report
  }

  /*
   * Schema validation successful
   */
  report.info.push('Configuration passed schema validation')

  /*
   * Verify node name resolution
   */
  for (const node of config.morio.nodes) {
    const [result, data] = await resolveHost(node)
    if (result) report.info.push(`Node ${node} resolves to: ${data.join()}`)
    else {
      report.errors.push(data)
      abort()

      return report
    }
  }

  /*
   * Try contacting nodes over HTTPS, ignore certificate
   */
  for (const node of config.morio.nodes) {
    const [result, data] = await testUrl(`https://${node}/`, { ignoreCertificate: true })
    if (result) report.info.push(data, `Node ${node} is reachable over HTTPS`)
    else {
      report.info.push(data)
      report.errors.push(`Unable to reach https://${node}/`)
      abort()

      return report
    }
  }

  /*
   * Looks good
   */
  report.valid = true
  report.deployable = true
  report.validated_config = config

  return report
}

/**
 * Helper method to validate the setup_token
 *
 * @param {string} token - The token to validate
 * @param {object} config - The configuration object
 * @return {bool|function} result - True of the token matches, a method that will return the error if it does not
 */
export const setupTokenValid = (token, config) => config.setup_token && token === config.setup_token

/**
 * Helper method to verify MORIO has not been setup yet
 *
 * @param {object} config - The configuration object
 * @return {bool|function} result - True of MORIO is not setup, a method that will return the error if it does not
 */
export const setupPossible = (config) => typeof config.setup_token !== 'undefined'
