import { defaults } from '@morio/defaults'
import { fromEnv } from '@morio/lib/env'

/*
 * The SAM API url
 */
const api = `http://${fromEnv('MORIO_SAM_HOST')}:${fromEnv('MORIO_SAM_PORT')}`

/*
 * General purpose method to call the SAM API with a GET request
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
const GET = async function (url, raw = false) {
  /*
   * Send the request to Sam
   */
  let response
  try {
    response = await fetch(api + url)
  } catch (err) {
    console.log(err)
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

  return [response.status, body]
}

/*
 * General purpose method to call the SAM API with a POST or PUT request
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
const POSTPUT = async function (method = 'POST', url, data, raw = false) {
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
   * Now send request to Sam
   */
  let response
  try {
    response = await fetch(api + url, request)
  } catch (err) {
    console.log(err)
  }

  /*
   * Handle status codes that have no response body
   */
  if ([204].includes(response.status)) return [response.status, {}]
  /*
   * Handle all other status codes
   */ else if (response.status < 400)
    return raw ? [response.status, await response.text()] : [response.status, await response.json()]

  /*
   * If we end up here, status code is 400 or higher so it's an error
   */
  return [response.status, false]
}

export const samClient = (tools) => {
  return {
    get: async (url) => GET(url),
    post: async (url, data) => POSTPUT('POST', url, data),
    put: async (url, data) => POSTPUT('PUT', url, data),
  }
}
