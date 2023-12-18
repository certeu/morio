import dns from 'node:dns'
import https from 'node:https'
import { fromEnv } from '@morio/lib/env'

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
export const testUrl = async (url, customOptions = {}) => {
  /*
   * Merge default and custom optioos
   */
  const options = {
    method: 'GET',
    headers: {},
    body: undefined,
    ignoreCertificate: false,
    returnAs: false,
    ...customOptions,
  }

  /*
   * If we need to ignore the certificate, this takes some more work
   */
  let agent = false
  if (options.ignoreCertificate && url.trim().toLowerCase().slice(0, 9) === 'https://') {
    agent = new https.Agent({ rejectUnauthorized: false })
  }

  /*
   * Set up the options for the request
   */
  const fetchOptions = { ...options }
  delete fetchOptions.ignoreCertificate
  delete fetchOptions.returnAs

  /*
   * Default fetch timeout would take too long.
   * It's a simple request, and if it can't work in a few seconds, what chance
   * do we have to run a cluster like this. So let's set 3 seconds and abort.
   */
  const proChoice = new AbortController()
  const timeoutValue = fromEnv('MORIO_UI_TIMEOUT_URL_CHECK')
  const timeout = setTimeout(() => proChoice.abort(), timeoutValue)
  let result
  try {
    result = await fetch(url, { ...fetchOptions, signal: proChoice.signal })
  } catch (err) {
    if (err.message && err.message.indexOf('aborted')) {
      return [false, `Timeout (${timeoutValue}ms) while checking URL: ${url}`]
    } else {
      clearTimeout(timeout)
      return [false, `Failed to check URL: ${host}`]
    }
  }
  clearTimeout(timeout)

  if (options.returnAs === 'status') return result.status
  if (options.returnAs === 'body') return result.body
  if (options.returnAs === 'text') return await result.text()
  if (options.returnAs === 'json') return await result.json()
  if (options.returnAs === 'check') return ![4, 5].includes(String(result.status).slice(0, 1))

  return result
}
