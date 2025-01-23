import { core, store } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { packageDefaults, packageDefaultsYouCanEdit } from '../config/services/dbuilder.mjs'

describe('Core Package Tests', () => {
  // GET /pkgs/clients/deb/defaults
  it(`Should GET /pkgs/clients/deb/defaults`, async () => {
    const result = await core.get(`/pkgs/clients/deb/defaults`)
    const d = result[1]

    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    for (const key of packageDefaultsYouCanEdit) {
      assert.deepStrictEqual(d[key], packageDefaults[key])
    }
    store.pkg_deb_defaults = d
  })

  // POST /pkgs/clients/deb/defaults
  it(`Should POST /pkgs/clients/deb/build`, async () => {
    const settings = {
      ...store.pkg_deb_defaults,
      Revision: 42,
      Description: 'Custom Description for Unit Tests',
    }
    const result = await core.post(`/pkgs/clients/deb/build`, settings)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.result, 'ok')
    assert.equal(d.status, 'building')
  })
})
