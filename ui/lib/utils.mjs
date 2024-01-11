/*
 * Unlike what is in @morio/lib all of these methods work in the browser
 */
import mustache from 'mustache'
import { config as configSchema } from '#schema/config'
import Joi from 'joi'

/**
 * A method to capitalize a string (first character only)
 *
 * @param {string} input - the input string
 * @return {string} Input - The output string
 */
export const capitalize = (string) =>
  typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : ''

/**
 * A helper method to verify that something is an error
 *
 * @param {mixed} input - The 'something' to check
 * @return {bool} result - Either true or false
 */
export const isError = (input) => input instanceof Error

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

/*
 * Formats bytes into a more readable representation
 *
 * @params {number} bytes = The value to format
 * @params {string} suffix = A suffic to add (can be /s for example)
 * @params {bool} asArray = Set this to true to not return a string but an array with value and units
 * @return {string|array} result - The formatted result
 */
export const formatBytes = (bytes, suffix = '', asArray = false) => {
  if (bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(
      parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10),
      sizes.length - 1
    )
    return asArray
      ? [`${(bytes / 1024 ** i).toFixed(i ? 1 : 0)}`, `${sizes[i]}${suffix}`]
      : `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)}${sizes[i]}${suffix}`
  }

  return asArray ? [0, 'Bytes' + suffix] : '0'
}

/*
 * Formats a Docker container name as returned by the API
 *
 * Essentially slices of the leading /
 *
 * @params {string} name = The original name (/test)
 * @return {string} newName - The formatted name (test)
 */
export const formatContainerName = (name) =>
  name && name.slice(0, 1) === '/' ? name.slice(1) : name

/*
 * Formats a number
 *
 * @params {number} nun = The original number
 * @params {string} suffix = Any suffix to add
 * @return {string} newNumber - The formatted number
 */
export const formatNumber = (num, suffix = '') => {
  if (num === null || typeof num === 'undefined') return num
  if (typeof num.value !== 'undefined') num = num.value
  // Small values don't get formatted
  if (num < 1) return num
  if (num) {
    const sizes = ['', 'K', 'M', 'B']
    const i = Math.min(
      parseInt(Math.floor(Math.log(num) / Math.log(1000)).toString(), 10),
      sizes.length - 1
    )
    return `${(num / 1000 ** i).toFixed(i ? 1 : 0)}${sizes[i]}${suffix}`
  }

  return '0'
}

/*
 * Common icon size for navigation items
 */
export const iconSize = 'h-8 w-8'

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
