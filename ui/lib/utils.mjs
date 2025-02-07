/*
 * Unlike what is in @morio/lib all of these methods work in the browser
 */
import mustache from 'mustache'
import Joi from 'joi'
import _slugify from 'slugify'
import { jwtDecode } from 'jwt-decode'
import { roles } from 'config/roles.mjs'

export const asJson = (data, pretty = true) => {
  const json = {}
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.trim()[0] === '{') json[key] = JSON.parse(val)
    else json[key] = val
  }

  return pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json)
}

export const decodeJwt = (token) => {
  let result
  try {
    result = jwtDecode(token)
  } catch (err) {
    return false
  }

  return result
}

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
 * Clone a data structure in a way that ensures no references
 * are kept, and it's just a plain old javascript object (pojo)
 *
 * @param {object} obj - The object to clone
 */
export const cloneAsPojo = (obj) => JSON.parse(JSON.stringify(obj))

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
    result = [false, `Failed to download URL: ${url}`]
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
 * A helper object to parse as JSON
 *
 * Handles errors and returns a best effort
 */
export const parseJson = (input) => {
  let result = input
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed !== 'string') result = parsed
    } catch (err) {
      // This is fine
    }
  }

  return result
}

/*
 * Shorten a UUID
 *
 * @param {string} uuid - The input UUID
 * @return {string} short - The shortened UUID
 */
export const shortUuid = (uuid) =>
  typeof uuid === 'string' && uuid.length > 5 ? uuid.slice(0, 5) : 'xxxxx'

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

/*
 * A simple method to display how long ago something was
 *
 * @param {string/number} timestamp - The time to parse
 * @return {string} timeago - How long ago it was
 */
export function timeAgo(timestamp, terse = true, suffix = ' ago') {
  const delta = new Date() - new Date(timestamp)

  const seconds = Math.floor(delta / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 1) return 'Now'
  if (seconds === 1) return `${terse ? '1s' : '1 second'}${suffix}`
  if (seconds === 60) return `${terse ? '1m' : '1 minute'}${suffix}`
  if (seconds < 91) return `${seconds}${terse ? 's' : ' seconds'}${suffix}`
  if (minutes === 60) return `${terse ? '1h' : '1 hour'}${suffix}`
  if (minutes < 120) return `${minutes}${terse ? 'm' : ' minutes'}${suffix}`
  if (hours === 24) return `${terse ? '1d' : '1 day'}${suffix}`
  if (hours < 48) return `${hours}${terse ? 'h' : ' hours'}${suffix}`
  if (days < 61) return `${days}${terse ? 'd' : ' days'}${suffix}`
  if (months < 25) return `${months}${terse ? 'M' : ' months'}${suffix}`
  return `${years}${terse ? 'Y' : ' years'}${suffix}`
}

/**
 * Helper method to validate the settings
 *
 * @param {object} api - The api client as returned from the useApi hook
 * @param {object} settings - The settings to validate
 * @param {function} setLoadingStatus - The setLoadingStatus method from loading context
 */
export const validateSettings = async (api, settings, setLoadingStatus) => {
  setLoadingStatus([true, 'Contacting Morio API'])
  const [report, statusCode] = await api.validateSettings(settings)
  if (report && statusCode === 200) setLoadingStatus([true, 'Settings validated', true, true])
  else setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])

  return report
}

/**
 * Helper method to validate the preseed settings
 *
 * @param {object} api - The api client as returned from the useApi hook
 * @param {object} preseed - The preseed settings to validate
 * @param {function} setLoadingStatus - The setLoadingStatus method from loading context
 */
export const validatePreseed = async (api, preseed, setLoadingStatus) => {
  setLoadingStatus([true, 'Contacting Morio API'])
  const [report, statusCode] = await api.validatePreseed(preseed)
  if (report && statusCode === 200) setLoadingStatus([true, 'Preseed validated', true, true])
  else setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])

  return report
}

/**
 *  Helper method to determine whether a user has a given role
 *
 *  @param {string} role - The current role of the user
 *  @param {string} min - The minimal required role
 *  @return {bool} allowed - True if the user has the role
 */
export const rbac = (role = false, min = 'engineer') => {
  if (!role || !roles.includes(role)) return false

  return roles.indexOf(role) >= roles.indexOf(min)
}

/**
 * Helper method to determine whether a page has children
 */
export const pageChildren = (page) => {
  const children = {}
  for (const [key, val] of Object.entries(page)) {
    if (!['t', 'o', 'r'].includes(key)) children[key] = val
  }

  return Object.keys(children).length > 0 ? children : false
}

/**
 * Helper method to slugify a string
 */
export const slugify = (input) =>
  _slugify(input, {
    replacement: '-',
    lower: true,
    strip: true,
    locale: 'en',
    trim: false,
    remove: /[*+~#^=`.(),;/?\\[]{}|'"!:@]/g,
  }).trim()

export const shortDate = (timestamp = false, withTime = true) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  if (withTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.hour12 = false
  }
  const ts = timestamp ? new Date(timestamp) : new Date()

  return ts.toLocaleDateString('en', options)
}
