import { api, sharedStorage } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('KV Store', async () => {
  /*
   * POST /kv/keys/test
   * Example response: 204 (no body)
   */
  it(`Should POST /kv/keys/test`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const value = 'Test value'
    const result = await api.post(`/kv/keys/test`, { value }, false, false, true, jwt)
    assert.equal(result[0], 204)
  })

  /*
   * POST /kv/keys/nested/path/key/with/some/depth
   * Example response: 204 (no body)
   */
  const nested = 'nested/path/key/with/some/depth'
  it(`Should POST /kv/keys/${nested}`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const value = 'Test value nested key'
    const result = await api.post(`/kv/keys/${nested}`, { value }, false, false, true, jwt)
    assert.equal(result[0], 204)
  })

  /*
   * POST /kv/keys/nested/path/key/with/some/depth?query=data#anchor-data
   * Example response: 204 (no body)
   */
  it(`Should POST /kv/keys/${nested}?query=data#anchor-data`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const value = 'Test value nested key (with anchor/query data)'
    const result = await api.post(
      `/kv/keys/${nested}?query=data#anchor-data`,
      { value },
      false,
      false,
      true,
      jwt
    )
    assert.equal(result[0], 204)
  })

  /*
   * POST /kv/keys/morio/internal/key
   * Example response: 204 (no body)
   */
  const internal = 'morio/internal/key'
  it(`Should POST /kv/keys/${internal}`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const value = 'Test morio/internal key'
    const result = await api.post(`/kv/keys/${internal}`, { value }, false, false, true, jwt)
    assert.equal(result[0], 400)
  })

  /*
   * GET /kv/keys/test
   * Example response:
   * {
   *   key: 'test',
   *   value: 'Test value'
   * }
   */
  it(`Should GET /kv/keys/test`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/keys/test`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.key, 'test')
    assert.equal(d.value, 'Test value')
  })

  /*
   * GET /kv/keys/test
   * Example response:
   * {
   *   key: 'test',
   *   value: 'Test value'
   * }
   */
  it(`Should GET /kv/keys/${nested}`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/keys/${nested}`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.key, nested)
    assert.equal(d.value, 'Test value nested key (with anchor/query data)')
  })

  /*
   * GET /kv/keys/list
   * Example response:
   * [
   *   'test',
   *   'nested/path/key/with/some/depth'
   * ]
   */
  it(`Should GET /kv/keys`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/keys`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.includes('test'), true)
    assert.equal(d.includes(nested), true)
  })

  /*
   * GET /kv/glob/nested/*
   * Example response:
   * [
   *   'nested/path/key/with/some/depth'
   * ]
   */
  it(`Should GET /kv/glob/nested/*`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/glob/nested/*`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 0)
  })

  /*
   * GET /kv/glob/nested/**
   * Example response:
   * [
   *   'nested/path/key/with/some/depth'
   * ]
   */
  it(`Should GET /kv/glob/nested/**`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/glob/nested/**`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 1)
  })

  /*
   * GET /kv/glob/nested/**
   * Example response:
   * [
   *   'nested/path/key/with/some/depth'
   * ]
   */
  it(`Should GET /kv/glob/nested/path/key/with/some/*`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/glob/nested/path/key/with/some/*`, false, false, true, jwt)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 1)
  })

  /*
   * DELETE /kv/keys/test
   * Example response: 204 (no content)
   */
  it(`Should DELETE /kv/keys/test`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.remove(`/kv/keys/test`, false, false, true, jwt)
    assert.equal(result[0], 204)
  })

  /*
   * GET /kv/keys/test
   * Example response:
   * {
   *   status: 404,
   *   title: 'No such key',
   *   detail: 'This is the API equivalent of a 404 page for the KV store. This key does not exist.',
   *   type: 'https://morio.it/docs/reference/errors/morio.api.kv.404',
   *   instance: 'http://api:3000/kv/keys/test'
   * }
   */
  it(`Should GET /kv/keys/test (but it's not longer there)`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.get(`/kv/keys/test`, false, false, true, jwt)
    assert.equal(result[0], 404)
  })

  /*
   * DELETE /kv/keys/test
   * Example response:
   * {
   *   status: 404,
   *   title: 'No such key',
   *   detail: 'This is the API equivalent of a 404 page for the KV store. This key does not exist.',
   *   type: 'https://morio.it/docs/reference/errors/morio.api.kv.404',
   *   instance: 'http://api:3000/kv/keys/test'
   * }
   */
  it(`Should DELETE /kv/keys/test (but it's no longer there)`, async () => {
    const jwt = sharedStorage.get('personal.mrt')

    const result = await api.remove(`/kv/keys/test`, false, false, true, jwt)
    assert.equal(result[0], 404)
  })
})
