import dns from 'dns';
import https from 'https';
import axios from 'axios';
import { strict as assert } from 'node:assert'
import { pipeline } from 'node:stream/promises'
import { getPreset } from '../config/index.mjs'

const dnsOptions = {
  family: 4, // Don't use IPv6
  all: true, // Return all addresses
};

// Create a global httpsAgent for requests with ignored SSL certificates
const globalHttpsAgent = new https.Agent({ rejectUnauthorized: false });

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
    ignoreCertificate: true,
    timeout: 1500,
    returnAs: false,
    returnError: false,
    ...customOptions,
  };

  if (options.ignoreCertificate && url.trim().toLowerCase().startsWith('https://')) {
    options.httpsAgent = globalHttpsAgent;
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

export async function get(url, raw = false, log = false, ignoreCertificate = true) {
  const requestConfig = ignoreCertificate
    ? { httpsAgent: globalHttpsAgent }
    : {};

  try {
    const response = await axios.get(url, requestConfig);

    const body = raw ? response.data : response.data;
    return [response.status, body];
  } catch (err) {
    if (log) console.error({ url, err });
    return [err.status, err.response.data];
  }
}

export async function streamGet(url, res, ignoreCertificate = true) {
  const requestConfig = ignoreCertificate
    ? { httpsAgent: globalHttpsAgent, responseType: 'stream' }
    : { responseType: 'stream' };

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const response = await axios.get(url, requestConfig);
    await pipeline(response.data, res);
  } catch (err) {
    console.error(err);
  }
}

async function __postput(method, url, data, raw = false, log = false, ignoreCertificate = true) {
  const requestConfig = {
    method,
    url,
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(ignoreCertificate && { httpsAgent: globalHttpsAgent }),
  };

  try {
    const response = await axios(requestConfig);

    if (response.status === 204) return [response.status, {}];
    const parsedData = raw ? response.data : response.data;
    return [response.status, parsedData];
  } catch (err) {
    if (log) console.error(err);
    return [err.status, err.response.data];
  }
}

export async function post(url, data, ignoreCertificate = true) {
  return __postput('POST', url, data, false, false, ignoreCertificate);
}

export async function put(url, data, ignoreCertificate = true) {
  return __postput('PUT', url, data, false, false, ignoreCertificate);
}

export async function patch(url, data, ignoreCertificate = true) {
  return __postput('PATCH', url, data, false, false, ignoreCertificate);
}

export async function remove(url, data, ignoreCertificate = true) {
  return __postput('DELETE', url, data, false, false, ignoreCertificate);
}

export function restClient(api) {
  return {
    get: (url, raw, log, ignoreCertificate) => get(api + url, raw, log, ignoreCertificate),
    post: (url, data, raw, log, ignoreCertificate) => __postput('POST', api + url, data, raw, log, ignoreCertificate),
    put: (url, data, raw, log, ignoreCertificate) => __postput('PUT', api + url, data, raw, log, ignoreCertificate),
    patch: (url, data, raw, log, ignoreCertificate) => __postput('PATCH', api + url, data, raw, log, ignoreCertificate),
    remove: (url, data, raw, log, ignoreCertificate) => __postput('DELETE', api + url, data, raw, log, ignoreCertificate),
    streamGet: (url, res, ignoreCertificate) => streamGet(api + url, res, ignoreCertificate),
  };
}

export function validateErrorResponse (result, errors, template) {
  const err = errors[template]

  if (!err) assert.equal('This is not a known error template', template)
  else {
    assert.equal(Array.isArray(result), true)
    // assert.equal(3, result.length, 3)  // return array only contains 2 [success, body]
    assert.equal(2, result.length, 2)
    assert.equal(result[0], err.status)
    assert.equal(typeof result[1], 'object')
    assert.equal(result[1].title, err.title)
    assert.equal(result[1].type, `${getPreset('MORIO_ERRORS_WEB_PREFIX')}${template}`)
    assert.equal(result[1].detail, err.detail)
    assert.equal(typeof result[1].instance, 'string')
  }
}