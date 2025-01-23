import { store, api, readPersistedData, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('Encryp/Decrypt data', async () => {
  const pdata = await readPersistedData()
  store.set('mrt', pdata.mrt)
  store.set('mrtAuth', pdata.mrtAuth)

  const time = String(Date.now())
  const data = {
    text: time,
    json: `{ "time": "${time}" }`,
  }

  // POST /encrypt (schema violation)
  it(`Should POST /encrypt (schema violation)`, async () => {
    const result = await api.post(`/encrypt`, { beta: data.text })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /encrypt
  it(`Should POST /encrypt (text)`, async () => {
    const result = await api.post(`/encrypt`, { data: data.text })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.set('encrypted.text', d)
  })

  // POST /encrypt
  it(`Should POST /encrypt (json)`, async () => {
    const result = await api.post(`/encrypt`, { data: data.json })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.iv, 'string')
    assert.equal(typeof d.ct, 'string')
    store.set('encrypted.json', d)
  })

  // POST /decrypt (schema violation)
  it(`Should POST /decrypt (schema violation)`, async () => {
    const result = await api.post(`/encrypt`, { beta: data.text })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /decrypt
  it(`Should POST /decrypt (text)`, async () => {
    const result = await api.post(`/decrypt`, store.get('encrypted.text'))
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.data, String(time))
  })

  // POST /decrypt
  it(`Should POST /decrypt (text)`, async () => {
    const result = await api.post(`/decrypt`, store.get('encrypted.json'))
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(JSON.parse(d.data).time, String(time))
  })
})
