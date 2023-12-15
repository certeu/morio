import mustache from 'mustache'
import isValidHostname from 'is-valid-hostname'
import { config as configSchema } from '@morio/schema/config'
import defaults from '@morio/defaults'

/**
 * Wrapper around mustache's render method to render templated strings
 *
 * In addition to calling mustache.render() this will also guard against
 * undefined input, which makes mustache throw an error.
 *
 * @param {string} input - The string to template
 * @param {object} replace - Any replacements in a key/value object
 * @return {string} result - The template string
 */
export const template = (input, replace = {}) =>
  typeof input === 'undefined' ? input : mustache.render(input, replace)

/**
 * A method to provide validation based on the Joi validation library
 *
 * Since we are only validating 1 field at a time, rather than the entire
 * config, we need to extract that field from the config schema. However, doing
 * so will break in-schema references, as they now fall outside of the schema
 * root. To fix that, you should pass the entire config object to this method
 * so it can be used to resolve those references.
 *
 * @param {string} key - Key to lookup in the schema
 * @param {any} value - Value to validate against the schema
 * @param {object} config - Config that will server as context to resolve schema references
 * @return {object} result - The Joi validation result object
 */
export const validate = (key, value, context) => {
  let result = true
  try {
    result = configSchema.extract(key).label(key).validate(value, { context })
  } catch (err) {
    // Not sure this needs handling
    return result
  }

  return result
}
