import dns from 'dns'
import https from 'https'
import axios from 'axios'
import { pipeline } from "node:stream/promises"

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
 * @param {object} log - A logger object so this thing can log
 */
export const resolveHost = async (host) => {
  let result
  try {
    result = await dns.promises.lookup(host, dnsOptions)
  } catch (err) {
    return [false, `Failed to resolve host: ${host}`]
  }

  return [true, result.map((record) => record.address)]
}

/**
 * Helper method to test a URL
 *
 * This will return what you ask it to, or false if it did not work.
 * Optionally you can bypass TLS verification.
 *
 * @param {string} host - The hostname to resolve
 * @param {object} customOptions - Options to customize the request
 */
export const testUrl = async (url, customOptions = {}, log = false) => {
  /*
   * Merge default and custom options
   */
  const options = {
    method: 'GET',
    headers: {},
    data: undefined,
    ignoreCertificate: false,
    timeout: 3000,
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
    // Swallow error?
    if (log) log(`${err.toString()} (${url})`)
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
 * General purpose method to call the core API with a GET request
 *
 * @param {string} url - The URL to call
 * @param {object} data - The data to send
 * @param {bool} raw - Set this to something truthy to not parse the result as JSON
 * @param {function} log - Optional logging method to log errors
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
export const get = async function (url, raw = false, log=false) {
  /*
   * Send the request to core
   */
  let response
  try {
    response = await fetch(url)
  } catch (err) {
    // Log error if requested
    if (log) log(err)
  }

  /*
   * Try parsing the body as JSON, fallback to text
   */
  let body
  try {
    body = raw ? await response.text() : await response.json()
  } catch (err) {
    try {
      body = await response.text()
    } catch (err) {
      body = false
    }
  }

  return [response?.status, body]
}

/*
 * General purpose method to call the core API with a streaming GET request
 *
 * @param {url} string - The URL to call
 * @return {object} res - The Express response object
 */
export const streamGet = async function (url, res) {
  /*
   * Send headers
   */
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  /*
   * Send the request to core
   */
  let response
  try {
    response = await fetch(url)
  } catch (err) {
    // Swallow error
    //console.log(err)
  }

  if (!response) {
    console.log('Response is not ok', typeof response)
  }

  /*
   * Try parsing the body as JSON, fallback to text
   */
  await pipeline(response.body, res)
}

/*
 * General purpose method to call the core API with a POST or PUT request
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @param {function} log - Optional logging method to log errors
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
const __postput = async function (method = 'POST', url, data, raw = false, log=false) {
  /*
   * Construct the request object with or without a request body
   */
  const request = { method }
  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    /*
     * We have data, add request body and set content type
     */
    request.body = JSON.stringify(data)
    request.headers = { 'Content-Type': 'application/json' }
  }

  /*
   * Now send request to core
   */
  let response
  try {
    response = await fetch(url, request)
  } catch (err) {
    if (log) log(err)
  }

  /*
   * Handle status codes that have no response body
   */
  if (response?.status && [204].includes(response.status)) return [response.status, {}]
  /*
   * Handle all other status codes
   */
  else if (response?.status && response.status < 400) {
    let data
    try {
      data = raw ? await response.text() : await response.json()
    }
    catch (err) {
      if (log) log(err)
      return raw
        ? [response.status, {err}]
        : [response.status, data]
    }

    return [response.status, data]
  }

  /*
   * If we end up here, status code is 400 or higher so it's an error
   */
  return [response?.status || 500, false]
}

export const post = async (url, data) => __postput('POST', url, data)
export const put = async (url, data) => __postput('PUT', url, data)

/**
 * General purpose client for a REST API
 *
 * @param {string} api - The API root URL
 * @return {object] client - The API client
 */
export const restClient = (api) => ({
  get: async (url, raw, log) => get(api + url),
  post: async (url, data, raw, log) => __postput('POST', api + url, data),
  put: async (url, data, raw, log) => __postput('PUT', api + url, data),
  streamGet: async (url, res) => streamGet(api + url, res),
})
