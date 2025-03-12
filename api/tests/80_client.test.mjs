import { store, api, readPersistedData, validateErrorResponse } from './utils.mjs'
import { errors } from '../src/errors.mjs'
import { describe, it } from 'node:test'
import process from 'node:process'
//import { strict as assert } from 'node:assert'

/*
 * FIXME: Complete these tests
 */

describe('Clients', async () => {
  const fqdn = process.env['MORIO_FQDN']
  const data = await readPersistedData()
  const client = {
    cluster: fqdn,
    info: {
      name: fqdn,
      fqdn: fqdn,
      os: 'linux',
      os_version: 'debian 12',
      arch: 'amd64',
      cores: 666,
      memory: 666666666,
      ips: ['127.0.0.1'],
      macs: ['00-B0-D0-63-C2-26'],
      packages: [],
    },
  }
  store.set('mrt', data.mrt)

  // POST /clients/join - but invalid schema
  it(`Should not POST /clients/join with an invalid schema`, async () => {
    const result = await api.post(`/clients/join`, {
      ...client,
      info: { ...client.info, fqdn: false },
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })
  /*
  // POST /clients/join - Join client
  it(`Should POST /clients/join`, async () => {
    const result = await api.post(`/clients/join`, client)
    const d = result[1]
    assert.equal(typeof d.crt, 'string')
    assert.equal(typeof d.key, 'string')
    assert.equal(typeof d.ca, 'string')
    assert.equal(typeof d.uuid, 'string')
    assert.equal(typeof d.secret, 'string')
    assert.equal(typeof d.cluster, 'string')
    assert.equal(Array.isArray(d.brokers), true)
    assert.equal(d.crt.includes('-----BEGIN CERTIFICATE-----'), true)
    assert.equal(d.crt.includes('-----END CERTIFICATE-----'), true)
    assert.equal(d.key.includes('-----BEGIN RSA PRIVATE KEY-----'), true)
    assert.equal(d.key.includes('-----END RSA PRIVATE KEY-----'), true)
    assert.equal(d.ca.includes('-----BEGIN CERTIFICATE-----'), true)
    assert.equal(d.ca.includes('-----END CERTIFICATE-----'), true)
    store.set('clientData', d)
  })
  */

  // POST /clients/rejoin - but invalid schema
  it(`Should not POST /clients/rejoin with an invalid schema`, async () => {
    const result = await api.post(`/clients/rejoin`, {
      ...client,
      info: { ...client.info, fqdn: false },
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })
  /*
  // POST /clients/rejoin - Join client
  it(`Should POST /clients/rejoin`, async () => {
    const result = await api.post(`/clients/rejoin`, client)
    const d = result[1]
    assert.equal(typeof d.crt, 'string')
    assert.equal(typeof d.key, 'string')
    assert.equal(typeof d.ca, 'string')
    assert.equal(typeof d.uuid, 'string')
    assert.equal(typeof d.secret, 'string')
    assert.equal(typeof d.cluster, 'string')
    assert.equal(Array.isArray(d.brokers), true)
    assert.equal(d.crt.includes('-----BEGIN CERTIFICATE-----'), true)
    assert.equal(d.crt.includes('-----END CERTIFICATE-----'), true)
    assert.equal(d.key.includes('-----BEGIN RSA PRIVATE KEY-----'), true)
    assert.equal(d.key.includes('-----END RSA PRIVATE KEY-----'), true)
    assert.equal(d.ca.includes('-----BEGIN CERTIFICATE-----'), true)
    assert.equal(d.ca.includes('-----END CERTIFICATE-----'), true)
    store.set('clientData', d)
  })
  */

  // POST /clients/push -- Push local config
  it(`Should not POST /clients/push without API key`, async () => {
    const result = await api.post(`/clients/push`, { modules: [], vars: [] })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })
  /*
  // POST /clients/push -- Push local config
  it(`Should not POST /clients/push with an invalid schema`, async () => {
    const data = store.get('clientData')
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${data.uuid}:${data.secret}`).toString('base64')
    }
    console.log({ headers, uuid: data.uuid, secret: data.secret})
    const result = await api.post(`/clients/push`, { modules: [], vars: [] }, headers)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })
  */

  // DELETE /clients/:uuid - Delete client
  //it(`Should DELETE /clients/:uuid`, async () => {
  //  const result = await api.delete(`/clients/join`, client)
  //  const d = result[1]
  //  console.log(d)
  //})

  /*
  app.post(`/clients/push`, rbac.client, Clients.push)
  app.get(`/clients/modules`, rbac.client, Clients.listModules)
  app.post(`/clients/report`, rbac.client, Clients.report)
  app.put(`/clients/modules/enable/:module`, rbac.client, Clients.enableModule)
  app.put(`/clients/modules/disable/:module`, rbac.client, Clients.disableModule)
  app.get(`/clients/pull/:uuid`, rbac.client, Clients.pull)
  app.delete(`/clients/:uuid`, rbac.client, Clients.unjoin)
  app.post(`/clients/cmdstatus`, rbac.client, Clients.addCommandStatus)
  app.get(`/clients/cmd/:id`, rbac.operator, Clients.getCommandInfo)
  app.get(`/clients/cmdstatus/:id`, rbac.operator, Clients.getCommandStatus)
  app.post(`/clients/invite/:type`, rbac.operator, Clients.createInvite)
  app.put(`/clients/cmd/:cmd`, rbac.operator, Clients.sendCommand)
  */
})
