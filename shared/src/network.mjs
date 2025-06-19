import dns from 'dns'
import https from 'https'
import axios from 'axios'

const dnsOptions = {
  family: 4, // Don't use IPv6
  all: true, // Return all addresses
}

/**
 * Helper method to resolve a hostname
 *
 * This will use whatever the OS provides.
 * So it could be using DNS, but it could also resolve based on
 * a local host file for example.
 *
 * @param {string} host - The hostname to resolve
 */
export async function resolveHost(host) {
  let result
  try {
    result = await dns.promises.lookup(host, dnsOptions)
  } catch (err) {
    return [false, `Failed to resolve host: ${host}`]
  }

  return [true, [...new Set(result.map((record) => record.address))]]
}

/**
 * Helper method to resolve a hostname as a single IP (or false)
 *
 * This will use whatever the OS provides.
 * So it could be using DNS, but it could also resolve based on
 * a local host file for example.
 *
 * @param {string} host - The hostname to resolve
 */
export async function resolveHostAsIp(host) {
  const result = (await resolveHost(host))[1]

  return Array.isArray(result) && result.length > 0 ? result[0] : false
}

/**
 * Helper method to test a URL
 *
 * This will return what you ask it to, or false if it did not work.
 * Optionally you can bypass TLS verification.
 *
 * @param {string} host - The hostname to resolve
 * @param {object} customOptions - Options to customize the request
 * @param {function} onError - The onError handler
 */
export async function testUrl(url, customOptions = {}, onError) {
  /*
   * Merge default and custom options
   */
  const options = {
    method: 'GET',
    headers: {},
    data: undefined,
    ignoreCertificate: false,
    timeout: 1500,
    returnAs: false,
    returnError: false,
    ...customOptions,
  }

  /*
   * If we need to ignore the certificate, this takes some more work
   */
  if (options.ignoreCertificate && url.trim().toLowerCase().slice(0, 8) === 'https://') {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  }

  /*
   * Run the request through Axios as NodeJS's built-in fetch does not allow
   * one to ignore the certificate
   */
  let result
  try {
    result = await axios(url, options)
  } catch (err) {
    // Invoke error handler if it is provided
    if (typeof onError === 'function') onError({ url, options, err, result })

    return options.returnError ? err : false
  }

  if (options.returnAs === 'status') return result.status
  if (options.returnAs === 'body') return result.data
  if (options.returnAs === 'text') return await result.data
  if (options.returnAs === 'json') return await result.data
  if (options.returnAs === 'check') return ![4, 5].includes(String(result.status).slice(0, 1))

  return result
}

/*
 * General purpose method to call an HTTP endpoint
 *
 * @param {object} options - The Axios options object (includes, url, method, and optional data)
 * @param {function} onError - The onError handler
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
async function http(options, onError) {
  /*
   * Send the request
   */
  let response
  try {
    response = await axios(options)
  } catch (err) {
    // Invoke error handler if it is provided
    if (typeof onError === 'function') onError({ options, err, response })

    return [false, false, err]
  }

  return [response?.status || false, response?.data || false, response]
}

/**
 * General purpose client for a REST API, uses Axios
 *
 * @param {string} api - The API root URL
 * @param {object} onError - A default error handler
 * @param {object} options - Any optional Axios options to apply to all requests
 * @return {object] client - The REST client
 */
export function restClient(api, onError, options={}) {
  /*
   * Merge default and custom options
   */
  const defaultOptions = {
    baseURL: api,
    method: 'GET',
    headers: {},
    data: undefined,
    timeout: 1500,
    ...options,
  }
  if (api.toLowerCase().slice(0,6) === 'https:') {
    // Needed for initial Traefik self-signed cert
    defaultOptions.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  }
  const mergeOptions = (custom) => ({
    ...defaultOptions,
    ...custom,
    headers: {
      ...defaultOptions.headers,
      ...(custom.headers || {})
    }
  })

  return {
    delete: async (url, options={}) => http(mergeOptions({ ...options, method: 'DELETE', url }), onError),
    get: async (url, options={}) => http(mergeOptions({ ...options, url }), onError),
    patch: async (url, data, options={}) => http(mergeOptions({ ...options, method: 'PATCH', data, url }), onError),
    post: async (url, data, options={}) => http(mergeOptions({ ...options, method: 'POST', data, url }), onError),
    put: async (url, data, options={}) => http(mergeOptions({ ...options, method: 'PUT', data, url }), onError),
  }
}
