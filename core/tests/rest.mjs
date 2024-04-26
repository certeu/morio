/*
 * General purpose method to call an HTTP REST API with a GET request
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
const __getdel = async function (method = 'GET', url, raw = false) {
  const request = { method }
  /*
   * Send the request to the API
   */
  let response
  try {
    response = await fetch(url, request)
  } catch (err) {
    // Return error
    return [false, err, response]
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

  return [response?.status, body, response]
}

/*
 * General purpose method to call an HTTP REST API with a POST or PUT request
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
const __patchpostput = async function (method = 'POST', url, data, raw = false) {
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
   * Now send request to the API
   */
  let response
  try {
    response = await fetch(url, request)
  } catch (err) {
    // Return error
    return [false, err, response]
  }

  /*
   * Handle status codes that have no response body
   */
  if ([204].includes(response.status)) return [response.status, {}, response]
  /*
   * Handle all other status codes
   */ else if (response.status < 400)
    return raw
      ? [response.status, await response.text(), response]
      : [response.status, await response.json(), response]

  /*
   * If we end up here, status code is 400 or higher so it's an error
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

  return [response.status, body, response]
}

/**
 * General purpose client for a REST API
 *
 * @param {string} api - The API root URL
 * @return {object] client - The API client
 */
export const restClient = (api) => ({
  delete: async (url, raw = false) => __getdel('DELETE', api + url, raw),
  get: async (url, raw = false) => __getdel('GET', api + url, raw),
  patch: async (url, data, raw = false) => __patchpostput('PATCH', api + url, data, raw),
  post: async (url, data, raw = false) => __patchpostput('POST', api + url, data, raw),
  put: async (url, data, raw = false) => __patchpostput('PUT', api + url, data, raw),
})
