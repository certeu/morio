import morioConfig from 'ui/morio.json' assert { type: 'json' }

/**
 * Constructor for the Morio API client
 *
 * @constructor
 * @param {headers} object - The headers to handle Morio authentication as retrieved from this hook
 */
export function MorioClient(headers={}) {
  // Store the headers so users don't have to pass them for each request
  this.headers = headers
  // Helper object that includes JSON content-type headers
  this.jsonHeaders = { ...headers, 'Content-Type': 'application/json' }
}


// API methods /////////////////////////////////////////////////////////////////

/**
 * General purpose method to call the Morio API
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
MorioClient.prototype.call = async function (url, data, raw=false) {
  let response
  try {
    response = await fetch(url, data)
  } catch (err) {
    console.log(err)
  }
  let result = false
  if (response) {
    try {
      result = raw
        ? await response.text()
        : await response.json()
    }
    catch (err) {
      console.log(err)
    }
  }

  return [result, response.status]
}

/**
 * Verifies a configuration
 *
 * This endpoint does not require authentication
 * @param {object} config - The configuration object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validateConfiguration = async function (config) {
  return await this.call(
    `${morioConfig.api}/validate/config`,
    {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify({ config })
    }
  )
}

/**
 * The useApi React hook
 */
export function useApi() {

  return {
    api: new MorioClient()
  }
}

