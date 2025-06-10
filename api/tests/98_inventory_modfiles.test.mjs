import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const modfile = {
  id: 1,
  mod: 'module',
  folder: 'folder',
  file: 'file.txt',
  content: 'content',
  source: 'source',
}

describe('Inventory Modfiles Tests', async () => {
  // POST /inventory/modfile
  it(`Should not POST /inventory/modfile with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/modfile', modfile, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/modfile
  it(`Should POST /inventory/modfile`, async () => {
    const [status, body] = await api.post('/inventory/modfile', modfile)
    assert.equal(status, 201)
    assert.equal(body.id, modfile.id)
    assert.equal(body.mod, modfile.mod)
    assert.equal(body.folder, modfile.folder)
    assert.equal(body.file, modfile.file)
    assert.equal(body.content, modfile.content)
    assert.equal(body.source, modfile.source)
  })

  // GET /inventory/modfile/{id}
  it(`Should GET /inventory/modfile/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/modfiles/${modfile.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, modfile.id)
    assert.equal(body.mod, modfile.mod)
    assert.equal(body.folder, modfile.folder)
    assert.equal(body.file, modfile.file)
    assert.equal(body.content, modfile.content)
    assert.equal(body.source, modfile.source)
  })

  // PATCH /inventory/modfile/{id}
  it(`Should PATCH /inventory/modfile/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.patch(`/inventory/modfiles/${modfile.id}`, {
      mod: 'module1',
      folder: 'folder1',
      file: 'file1.txt',
      content: 'content1',
      source: 'source1',
    })
    assert.equal(status, 200)
    assert.equal(body.id, modfile.id)
    assert.equal(body.mod, 'module1')
    assert.equal(body.folder, 'folder1')
    assert.equal(body.file, 'file1.txt')
    assert.equal(body.content, 'content1')
    assert.equal(body.source, 'source1')
  })

  // DELETE /inventory/modfile/{id}
  it(`Should DELETE /inventory/modfile/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/modfiles/${modfile.id}`)
    assert.equal(status, 204)
  })
})
