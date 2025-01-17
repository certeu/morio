import { core, store } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Utils Tests', () => {
  // POST /ca/certificate
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

  // POST /encrypt and submit a string
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

  // POST /encrypt and submit an object (as JSON)
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

  // POST /decrypt (string version)
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

  // POST /decrypt (JSON version)
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
