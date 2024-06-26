import { requestSchema as schema, settingsSchema } from '../schema.mjs'
import { resolveHost, testUrl } from '#shared/network'
import { randomString } from '#shared/crypto'
import get from 'lodash.get'
import { store } from './store.mjs'

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
 * Validates input to a schema you pass it (ad-hoc validation)
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
export const validateSchema = async (input, schema) => {
  let valid
  try {
    valid = await schema.validateAsync(input)
  } catch (err) {
    return [false, err]
  }

  return [valid, null]
}

/**
 * Validates deployment settings
 *
 * This will not catch all problems, but it should at least catch some common
 * settings issues, in particular for people writing their own settings.
 *
 * @param {object} newSettings - The settings to validate
 * @retrun {object} report - An object detailing the results of the validation
 */
export const validateSettings = async (newSettings) => {
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
  const abort = () => {
    report.warnings.push(`Validation was terminated before completion due to errors`)

    return report
  }

  /*
   * Nodes will check that there are as many as node_count
   * But if the entire settings object is empty, this will pass validation
   * So let's guard against that here
   */
  if (
    !newSettings?.deployment ||
    !newSettings.deployment.node_count ||
    !newSettings.deployment.nodes ||
    !Array.isArray(newSettings.deployment.nodes) ||
    newSettings.deployment.nodes.length !== newSettings.deployment.node_count
  ) {
    report.info.push(`Settings are not valid`)
    report.errors.push(`Node count and nodes do not match`)

    return abort()
  }

  /*
   * Validate settings against the settings schema
   */
  let settings
  try {
    settings = await settingsSchema.validateAsync(newSettings)
  } catch (err) {
    /*
     * Validate failed, bail out here
     */
    report.info.push(`Settings did not pass schema validation`)
    for (const msg of err.details) report.errors.push(msg.message)

    return abort()
  }

  /*
   * Schema validation successful
   */
  report.info.push('Settings passed schema validation')

  /*
   * Verify nodes
   */
  let i = 0
  const ips = []
  for (const node of settings.deployment.nodes) {
    i++
    report.info.push(`Validating node ${i}: ${node}`)
    /*
     * Verify node name resolution
     */
    const [resolved, ipsOrError] = await resolveHost(node)
    if (resolved) {
      report.info.push(`Node ${i} resolves to: ${ipsOrError.join()}`)
      ips.push(...ipsOrError)
    } else {
      report.info.push(`Validation failed for node ${i}`)
      report.errors.push(ipsOrError)

      return abort()
    }

    /*
     * Try contacting nodes over HTTPS, ignore certificate
     * We bypass this when it's the unit test node
     */
    if (node !== store.getPreset('MORIO_UNIT_TEST_HOST')) {
      const https = await testUrl(`https://${node}/`, {
        ignoreCertificate: true,
        returnAs: 'check',
      })
      if (https) report.info.push(`Node ${i} is reachable over HTTPS`)
      else {
        report.info.push(`Validation failed for node ${i}`)
        report.errors.push(`Unable to reach node ${i} at: https://${node}/`)

        return abort()
      }

      /*
       * Try contacting nodes over HTTPS, also validate certificate
       */
      const validCert = await testUrl(`https://${node}/`, { returnAs: 'check' })
      if (validCert) report.info.push(`Node ${i} uses a valid TLS certificate`)
      else {
        report.info.push(`Certificate validation failed for node ${i}`)
        report.warnings.push(`Node ${node} uses an untrusted TLS certificate`)
      }
    } else {
      report.info.push(`This is the unit test host, not validating HTTPS connection.`)
    }

    /*
     * Does the node run Morio and is it not setup?
    const runsMorio = await testUrl(`https://${node}/api/status`, { returnAs: 'json' })
    if (runsMorio) {
      // FIXME: Handle api return data
      report.info.push(`Node ${i} runs Morio and is ready for setup`)
    } else {
      report.info.push(`Node ${i} does not run Morio`)
      report.warnings.push(`Node ${node} uses an untrusted TLS certificate`)
      report.errors.push(`All nodes need to run Morio, but node ${i} does not`)
      abort()
    }
     */
  }

  /*
   * If some of the nodes resolve to the same IP, that is probably going to be a problem
   */
  if (ips.length !== [...new Set([...ips])].length) {
    report.errors.push('Different nodes share a common IP address')

    return abort()
  }

  /*
   * Looks good
   */
  report.valid = true
  report.deployable = true
  report.validated_settings = settings

  return report
}

/**
 * Validates a (potential) Morio node
 *
 * @param {string} hostname - The hostname of the node to validate
 * @return {object} valid - The result of the validation
 */
export const validateNode = async (hostname) => {
  const data = {}

  /*
   * Resolve hostname
   */
  const [resolved, ipsOrError] = await resolveHost(hostname)
  if (resolved) data.ips = ipsOrError
  else data.ips = []

  /*
   * Generate a random ping challenge
   */
  store.info.ping = randomString(8)

  /*
   * Try contacting node over HTTPS, ignore certificate
   */
  const https = await testUrl(`https://${hostname}/${store.prefix}/validate/ping`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })
  if (https) {
    data.https = true
    if (https.morio_node) data.morio_node = true
    else data.morio_node = false
    if (https.pong === store.info.ping) data.this_morio_node = true
    else data.this_morio_node = false
  }

  return data
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
 * Helper method to verify Morio has not been setup yet
 *
 * @param {object} config - The configuration object
 * @return {bool|function} result - True of Morio is not setup, a method that will return the error if it does not
 */
export const setupPossible = (config) => typeof config.setup_token !== 'undefined'
