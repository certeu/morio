import { core, store } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Utils Tests', () => {
  /*
   * POST /ca/certificate
   *
   * Example response:
   * {
   *   certificate: {
   *     crt: '-----BEGIN CERTIFICATE-----\n' +
   *       'MIIFQjCCAyqgAwIBAgIQe8a4SlUHOofK9moTEwUvuzANBgkqhkiG9w0BAQsFADCB\n' +
   *       ...
   *       '-----END CERTIFICATE-----\n',
   *     ca: '-----BEGIN CERTIFICATE-----\n' +
   *       'MIIGWjCCBEKgAwIBAgIBATANBgkqhkiG9w0BAQsFADCBlDELMAkGA1UEBhMCQkUx\n' +
   *       ...
   *       '-----END CERTIFICATE-----\n',
   *     certChain: [Array],
   *     tlsOptions: {
   *       cipherSuites: [
   *         "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
   *         "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256"
   *       ],
   *       minVersion: 1.2,
   *       maxVersion: 1.3,
   *       renegotiation: false
   *     }
   *   },
   *   key: '-----BEGIN RSA PRIVATE KEY-----\r\n' +
   *    'MIIEpAIBAAKCAQEAw8EG/si6UJYmfCkP3zvHiP4Wda1lP6CciuZD0EmTdoMWsHJb\r\n' +
   *    ...
   *    '-----END RSA PRIVATE KEY-----\r\n'
   * }
   */
  it(`Should POST /ca/certificate`, async () => {
    const cert = {
      certificate: {
        cn: 'A Morio Test Certificate',
        c: 'IE',
        st: 'Dublin',
        l: 'Blanchardstown',
        o: 'Creepy Pub Crowlers',
        ou: 'Oh You',
        san: ['core.unit.test.morio.it', 'san.unit.test.mor.io'],
      },
    }
    const result = await core.post(`/ca/certificate`, cert)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.certificate, 'object')
    assert.equal(typeof d.certificate.crt, 'string')
    assert.equal(d.certificate.crt.includes('--BEGIN CERTIFICATE--'), true)
    assert.equal(d.certificate.crt.includes('--END CERTIFICATE--'), true)
    assert.equal(d.certificate.ca.includes('--BEGIN CERTIFICATE--'), true)
    assert.equal(d.certificate.ca.includes('--END CERTIFICATE--'), true)
    assert.equal(d.key.includes('--BEGIN RSA PRIVATE KEY--'), true)
    assert.equal(d.key.includes('--END RSA PRIVATE KEY--'), true)
  })

  /*
   * POST /encrypt and submit a string
   *
   * Example response:
   * {
   *   iv: '9fe250fd9092dcfd0b1d297f2af123bd',
   *   ct: 'bf396d828859862d45503765257743b2'
   * }
   */
  it(`Should POST /encrypt (string)`, async () => {
    store.text = {
      plain: 'banana',
    }
    const result = await core.post(`/encrypt`, { data: store.text.plain })
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.text.enc = d
  })

  /*
   * POST /encrypt and submit an object (as JSON)
   *
   * Example response:
   * {
   *   iv: '0921500d53f2ce4d83d48de7f2476b7a',
   *   ct: '786f0dbd58a7b420ec9387656d3c8d185b636f4b2aafcaaab950b0450b85db1b9c3d72d36f257c3baccf991e914ad173'
   * }
   */
  it(`Should POST /encrypt (object)`, async () => {
    store.json = {
      plain: {
        key: 'value',
        other_key: ['other', 'value'],
      },
    }
    const result = await core.post(`/encrypt`, { data: store.json.plain })
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.json.enc = d
  })

  /*
   * POST /decrypt (string version)
   *
   * Example response:
   * { data: 'banana' }
   */
  it(`Should POST /decrypt (string)`, async () => {
    const result = await core.post(`/decrypt`, store.text.enc)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.data, 'string')
    assert.equal(d.data, store.text.plain)
  })

  /*
   * POST /decrypt (JSON version)
   *
   * Example response:
   * { data: 'banana' }
   */
  it(`Should POST /decrypt (string)`, async () => {
    const result = await core.post(`/decrypt`, store.json.enc)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.data, 'object')
    assert.deepEqual(d.data, store.json.plain)
  })
})
