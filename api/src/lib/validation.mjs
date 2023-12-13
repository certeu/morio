import { requestSchema as schema } from '../schema.mjs'
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
  }
  catch (err) {
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
 * @param {object} currentConfig - The current running config
 * @retrun {object} report - An object detailing the results of the validation
 */
export const validateConfiguration = async (newConfig, currentConfig) => {
  const report = {
    valid: true,
    deloyable: true,
    errors: [],
    warnings: [],
  }

  /*
   * node_count should be an odd integer
   */



  return report
}

/**
 * Helper method to validate the setup_token
 *
 * @param {string} token - The token to validate
 * @param {object} config - The configuration object
 * @return {bool|function} result - True of the token matches, a method that will return the error if it does not
 */
export const setupTokenValid = (token, config) => (config.setup_token && token === config.setup_token)

/**
 * Helper method to verify MORIO has not been setup yet
 *
 * @param {object} config - The configuration object
 * @return {bool|function} result - True of MORIO is not setup, a method that will return the error if it does not
 */
export const setupPossible = (config) => (typeof config.setup_token !== 'undefined')



