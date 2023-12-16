/*
 * Unlike what is in @morio/lib all of these methods work in the browser
 */
import mustache from 'mustache'
import { config as configSchema } from '@morio/schema/config'
import defaults from '@morio/defaults'
import Joi from 'joi'

/**
 * A method to validate an input string is a uri
 *
 * @param {string} uri - The input uri to validate
 * @return {bool} result - Either true or false
 */
export const isUri = (uri) => {
  let result
  try {
    result = Joi.string().required().uri().validate(uri)
  } catch (err) {
    // Not sure this needs handling
    return result
  }

  return typeof result.error === 'undefined'
}

/**
 * Helper method to download a file
 *
 * @param {string} url - The URL to download
 * @param {object} options - Extra options
 */
export const download = async (
  url,
  options = {
    asJson: false,
  }
) => {
  /*
   * Default fetch timeout would take too long. Let's use 10 seconds instead.
   */
  const timeoutValue = 10000
  const proChoice = new AbortController()
  const timeout = setTimeout(() => proChoice.abort(), timeoutValue)
  let result
  try {
    result = await fetch(url, { method: 'GET', signal: proChoice.signal })
  } catch (err) {
    clearTimeout(timeout)
    result = [false, `Failed to download URL: ${host}`]
  }
  clearTimeout(timeout)

  let data
  try {
    data = options.asJson ? await result.json() : await result.text()
    result = [true, data]
  } catch (err) {
    return [false, err]
  }

  return result
}

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

/**
 * Helper method to validate the configuration
 *
 * @param {object} api - The api client as returned from the useApi hook
 * @param {object} config - The configuration to validate
 * @param {function} setLoadingStatus - The setLoadingStatus method from loading context
 */
export const validateConfiguration = async (api, config, setLoadingStatus) => {
  setLoadingStatus([true, 'Contacting Morio API'])
  const [report, statusCode] = await api.validateConfiguration(config)
  if (report && statusCode === 200) setLoadingStatus([true, 'Configuration validated', true, true])
  else setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])

  return report
}
