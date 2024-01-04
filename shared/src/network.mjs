import dns from 'dns'
import https from 'https'
import axios from 'axios'
import { fromEnv } from './env.mjs'

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
    data: undefined,
    ignoreCertificate: false,
    timeout: 3000,
    returnAs: false,
    ...customOptions,
  }

  /*
   * If we need to ignore the certificate, this takes some more work
   */
  let agent = false
  if (options.ignoreCertificate && url.trim().toLowerCase().slice(0, 8) === 'https://') {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  } else {
    console.log('NOT IGNOIREING', options, `)${url.trim().toLowerCase().slice(0,8)}(`)
  }

  /*
   * Run the request through Axios as NodeJS's built-in fetch does not allow
   * one to ignore the certificate
   */
  let result
  try {
    result = await axios(url, options)
  } catch (err) {
    console.log(err)
    return false
  }

  if (options.returnAs === 'status') return result.status
  if (options.returnAs === 'body') return result.data
  if (options.returnAs === 'text') return await result.data
  if (options.returnAs === 'json') return await result.data
  if (options.returnAs === 'check') return ![4, 5].includes(String(result.status).slice(0, 1))

  return result
}

