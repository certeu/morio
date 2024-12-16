import dns from 'dns';
import https from 'https';
import axios from 'axios';
import { strict as assert } from 'node:assert'
import { pipeline } from 'node:stream/promises';

const dnsOptions = {
  family: 4, // Don't use IPv6
  all: true, // Return all addresses
};

/**
 * Helper method to resolve a hostname
 */
export async function resolveHost(host) {
  let result;
  try {
    result = await dns.promises.lookup(host, dnsOptions);
  } catch (err) {
    return [false, `Failed to resolve host: ${host}`];
  }
  return [true, result.map((record) => record.address)];
}

export async function resolveHostAsIp(host) {
  const result = (await resolveHost(host))[1];
  return Array.isArray(result) && result.length > 0 ? result[0] : false;
}

/**
 * Helper method to test a URL
 */
export async function testUrl(url, customOptions = {}) {
  const options = {
    method: 'GET',
    headers: {},
    data: undefined,
    ignoreCertificate: false,
    timeout: 1500,
    returnAs: false,
    returnError: false,
    ...customOptions,
  };

  if (options.ignoreCertificate && url.trim().toLowerCase().startsWith('https://')) {
    options.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  try {
    const result = await axios(url, options);

    switch (options.returnAs) {
      case 'status':
        return result.status;
      case 'body':
      case 'text':
      case 'json':
        return result.data;
      case 'check':
        return ![4, 5].includes(String(result.status).charAt(0));
      default:
        return result;
    }
  } catch (err) {
    return options.returnError ? err : false;
  }
}

export async function get(url, raw = false, log = false) {
  try {
    const response = await axios.get(url);
    const body = raw ? response.data : JSON.parse(response.data);
    return [response.status, body];
  } catch (err) {
    if (log) console.error({ url, err });
    return [false, false];
  }
}

export async function streamGet(url, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    await pipeline(response.data, res);
  } catch (err) {
    console.error(err);
  }
}

async function __postput(method, url, data, raw = false, log = false) {
  const requestConfig = {
    method,
    url,
    headers: { 'Content-Type': 'application/json' },
    data,
  };

  try {
    const response = await axios(requestConfig);

    if (response.status === 204) return [response.status, {}];
    const parsedData = raw ? response.data : JSON.parse(response.data);
    return [response.status, parsedData];
  } catch (err) {
    if (log) console.error(err);
    return [500, false];
  }
}

export async function post(url, data) {
  return __postput('POST', url, data);
}

export async function put(url, data) {
  return __postput('PUT', url, data);
}

export function restClient(api) {
  return {
    get: (url, raw, log) => get(api + url, raw, log),
    post: (url, data, raw, log) => __postput('POST', api + url, data, raw, log),
    put: (url, data, raw, log) => __postput('PUT', api + url, data, raw, log),
    streamGet: (url, res) => streamGet(api + url, res),
  };
}

export function validateErrorResponse (result, errors, template) {
    const err = errors[template]
    if (!err) assert.equal('This is not a known error template', template)
    else {
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], err.status)
      assert.equal(typeof result[1], 'object')
      assert.equal(result[1].title, err.title)
      assert.equal(result[1].type, `${getPreset('MORIO_ERRORS_WEB_PREFIX')}${template}`)
      assert.equal(result[1].detail, err.detail)
      assert.equal(typeof result[1].instance, 'string')
    }
  }