/*
 * Fetch doesn't allow bypassing certificate validation
 * That's why we have axios to talk to the proxy over SSL
 */
import axios from 'axios'
import https from 'node:https'

/*
 * Set up axios instance that does not care about certificate validity
 */
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/*
 * General purpose method to call an HTTP REST API with a GET request over SSL without verifying the certificate
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @return {response} object - Either the result parse as JSON, or false in case of trouble
 */
const __getdel = async function (method = 'GET', url, headers = {}) {
  const request = { method, headers, httpsAgent }
  /*
   * Send the request to the API
   */
  let response
  try {
    response = await axios(url, request)
  } catch (err) {
    // Return error
    return [err?.response?.status, err?.response?.data, err?.response]
  }

  return [response?.status, response?.data, response]
}

/*
 * General purpose method to call an HTTP REST API with a POST or PUT request over SSL without verifying the certificate
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @return {response} object - Either the result parse as JSON, or false in case of trouble
 */
const __patchpostput = async function (method = 'POST', url, data, headers = {}) {
  /*
   * Construct the request object with or without a request body
   */
  const request = {
    url,
    data,
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    httpsAgent,
  }

  /*
   * Now send request to the API
   */
  let response
  try {
    response = await axios(request)
  } catch (err) {
    // Return error
    return [err?.response?.status, err?.response?.data, err?.response]
  }

  return [response?.status, response?.data, response]
}

/**
 * General purpose client for a REST API
 *
 * @param {string} api - The API root URL
 * @return {object] client - The API client
 */
export const restClient = (api) => ({
  delete: async (url, headers) => __getdel('DELETE', api + url, headers),
  get: async (url, headers) => __getdel('GET', api + url, headers),
  patch: async (url, data, headers) => __patchpostput('PATCH', api + url, data, headers),
  post: async (url, data, headers) => __patchpostput('POST', api + url, data, headers),
  put: async (url, data, headers) => __patchpostput('PUT', api + url, data, headers),
})
