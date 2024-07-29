import { authenticator } from '@otplib/preset-default'
import { store, accounts, attempt, isCoreReady, isApiReady, api, loadKeys, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const timeout = 80000

describe('Encryp/Decrypt data', async () => {
  const keys = await loadKeys()
  store.set('mrt', keys.mrt)
  const mrt = keys.mrt

  const time = String(Date.now())
  const data = {
    text: time,
    json: `{ "time": "${time}" }`
  }

  /*
   * POST /encrypt (schema violation)
   * Example response:
   * {
   *   status: 400,
   *   data: {
   *     status: 400,
   *     title: 'This request violates the data schema',
   *     detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *     type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *     instance: 'http://api:3000/encrypt',
   *     schema_violation: '"data" is required'
   *   }
   * }
   */
  it(`Should POST /encrypt (schema violation)`, async () => {
    const result = await api.post(`/encrypt`, { beta: data.text })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /encrypt
   * Example response:
   * {
   *   iv: '9989922c677e1d4d0f9a9d1556ac7e7d',
   *   ct: '4e3fafac2f4febb1c40b7cced3ddcd21'
   * }
   */
  it(`Should POST /encrypt (text)`, async () => {
    const result = await api.post(`/encrypt`, { data: data.text })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.set('encrypted.text', d)
  })

  /*
   * POST /encrypt
   * Example response:
   * {
   *   iv: '9989922c677e1d4d0f9a9d1556ac7e7d',
   *   ct: '4e3fafac2f4febb1c40b7cced3ddcd21'
   * }
   */
  it(`Should POST /encrypt (json)`, async () => {
    const result = await api.post(`/encrypt`, { data: data.json })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.set('encrypted.json', d)
  })

  /*
   * POST /decrypt (schema violation)
   * Example response:
   * {
   *   status: 400,
   *   data: {
   *     status: 400,
   *     title: 'This request violates the data schema',
   *     detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *     type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *     instance: 'http://api:3000/encrypt',
   *     schema_violation: '"data" is required'
   *   }
   * }
   */
  it(`Should POST /decrypt (schema violation)`, async () => {
    const result = await api.post(`/encrypt`, { beta: data.text })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /decrypt
   * Example response:
   * {
   *   iv: '9989922c677e1d4d0f9a9d1556ac7e7d',
   *   ct: '4e3fafac2f4febb1c40b7cced3ddcd21'
   * }
   */
  it(`Should POST /decrypt (text)`, async () => {
    const result = await api.post(`/decrypt`, store.get('encrypted.text'))
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.data, String(time))
  })

  /*
   * POST /decrypt
   * Example response:
   * {
   *   iv: '9989922c677e1d4d0f9a9d1556ac7e7d',
   *   ct: '4e3fafac2f4febb1c40b7cced3ddcd21'
   * }
   */
  it(`Should POST /decrypt (text)`, async () => {
    const result = await api.post(`/decrypt`, store.get('encrypted.json'))
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(JSON.parse(d.data).time, String(time))
  })
})
