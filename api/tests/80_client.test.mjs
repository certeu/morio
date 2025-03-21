import { store, api, readPersistedData, validateErrorResponse } from './utils.mjs'
import { errors } from '../src/errors.mjs'
import { describe, it } from 'node:test'
import process from 'node:process'
import { strict as assert } from 'node:assert'

/*
 * FIXME: Complete these tests
 */

const newHost = {
  id: 'test-host-1',
  fqdn: 'test.example.com',
  name: 'Test Host',
  arch: 'x86_64',
  cores: 4,
  memory: 8192,
  notes: 'Test host for API',
  tags: 'test,api',
  last_update: new Date().toISOString(),
}

const newIP = {
  ip: '192.168.1.1',
  version: 'IPv4',
}

const newMAC = { mac: 'AA:BB:CC:DD:EE:FF' }

const newOS = {
  id: 'os-1',
  name: 'Ubuntu',
  version: '22.04',
}

const newPkg = {
  id: 'pkg-1',
  name: 'Node.js',
  version: '18.16.0',
}

const newMod = {
  mod: 'mod-1',
  data: 'Sample module data',
}

const newModVar = {
  id: 'var-1',
  val: 'Sample value',
  info: 'Sample info',
  mod: 'mod-1',
}

const newHostVar = {
  id: 1,
  key: 'host-key-1',
  val: 'Sample value',
  info: 'Sample info',
  host: 'host-1',
}

const newModFile = {
  id: 1,
  mod: 'mod-1',
  folder: 'folder-1',
  file: 'file-1.txt',
  content: 'Sample content',
  source: 'Sample source',
}

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

describe('Hosts API Tests', () => {
  it('Should create a new host', async () => {
    const result = await api.post('/host', newHost)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newHost.id)
    assert.equal(d.fqdn, newHost.fqdn)
    assert.equal(d.name, newHost.name)
    assert.equal(d.arch, newHost.arch)
    assert.equal(d.cores, newHost.cores)
    assert.equal(d.memory, newHost.memory)
    assert.equal(d.notes, newHost.notes)
    assert.equal(d.tags, newHost.tags)
    assert.equal(typeof d.last_update, 'string')
  })

  it('Should retrieve the created host', async () => {
    const result = await api.get('/hosts')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((host) => host.fqdn === 'test.example.com'),
      true
    )
  })

  it('Should not allow duplicate host creation', async () => {
    const result = await api.post('/host', newHost)

    assert.equal(result[0], 400)
  })

  it('Should delete a host', async () => {
    const hosts = await api.get('/hosts')
    const hostToDelete = hosts[1].find((host) => host.fqdn === 'test.example.com')
    const result = await api.delete(`/hosts/${hostToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the host was deleted', async () => {
    const result = await api.get('/hosts')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((host) => host.fqdn === 'test.example.com'),
      false
    )
  })
})

describe('IPs API Tests', () => {
  it('Should create a new IP entry', async () => {
    const result = await api.post('/ip', newIP)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.ip, newIP.ip)
    assert.equal(d.version, newIP.version)
  })

  it('Should retrieve the created IP entry', async () => {
    const result = await api.get('/ips')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((ip) => ip.ip === '192.168.1.1'),
      true
    )
  })

  it('Should not allow duplicate IP creation', async () => {
    const result = await api.post('/ip', newIP)

    assert.equal(result[0], 400)
  })

  it('Should delete an IP entry', async () => {
    const ips = await api.get('/ips')
    const ipToDelete = ips[1].find((ip) => ip.ip === '192.168.1.1')
    const result = await api.delete(`/ips/${ipToDelete.ip}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the IP entry was deleted', async () => {
    const result = await api.get('/ips')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((ip) => ip.ip === '192.168.1.1'),
      false
    )
  })
})

describe('MACs API Tests', () => {
  it('Should create a new MAC entry', async () => {
    const result = await api.post('/mac', newMAC)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.mac, newMAC.mac)
  })

  it('Should retrieve the created MAC entry', async () => {
    const result = await api.get('/macs')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((mac) => mac.mac === 'AA:BB:CC:DD:EE:FF'),
      true
    )
  })

  it('Should not allow duplicate MAC creation', async () => {
    const result = await api.post('/mac', newMAC)

    assert.equal(result[0], 400)
  })

  it('Should delete a MAC entry', async () => {
    const macs = await api.get('/macs')
    const macToDelete = macs[1].find((mac) => mac.mac === 'AA:BB:CC:DD:EE:FF')
    const result = await api.delete(`/macs/${macToDelete.mac}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the MAC entry was deleted', async () => {
    const result = await api.get('/macs')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((mac) => mac.mac === 'AA:BB:CC:DD:EE:FF'),
      false
    )
  })
})

describe('Operating Systems API Tests', () => {
  it('Should create a new OS entry', async () => {
    const result = await api.post('/os', newOS)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newOS.id)
    assert.equal(d.name, newOS.name)
    assert.equal(d.version, newOS.version)
  })

  it('Should retrieve the created OS entry', async () => {
    const result = await api.get('/oss')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((os) => os.id === 'os-1' && os.name === 'Ubuntu'),
      true
    )
  })

  it('Should not allow duplicate OS creation', async () => {
    const result = await api.post('/os', newOS)

    assert.equal(result[0], 400)
  })

  it('Should delete an OS entry', async () => {
    const oss = await api.get('/oss')
    const osToDelete = oss[1].find((os) => os.id === 'os-1')
    const result = await api.delete(`/oss/${osToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the OS entry was deleted', async () => {
    const result = await api.get('/oss')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((os) => os.id === 'os-1'),
      false
    )
  })
})

describe('Packages API Tests', () => {
  it('Should create a new package entry', async () => {
    const result = await api.post('/pkg', newPkg)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newPkg.id)
    assert.equal(d.name, newPkg.name)
    assert.equal(d.version, newPkg.version)
  })

  it('Should retrieve the created package entry', async () => {
    const result = await api.get('/pkgs')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((pkg) => pkg.id === 'pkg-1' && pkg.name === 'Node.js'),
      true
    )
  })

  it('Should not allow duplicate package creation', async () => {
    const result = await api.post('/pkg', newPkg)

    assert.equal(result[0], 400)
  })

  it('Should delete a package entry', async () => {
    const pkgs = await api.get('/pkgs')
    const pkgToDelete = pkgs[1].find((pkg) => pkg.id === 'pkg-1')
    const result = await api.delete(`/pkgs/${pkgToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the package entry was deleted', async () => {
    const result = await api.get('/pkgs')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((pkg) => pkg.id === 'pkg-1'),
      false
    )
  })
})

describe('Modules API Tests', () => {
  it('Should create a new module entry', async () => {
    const result = await api.post('/mod', newMod)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.mod, newMod.mod)
    assert.equal(d.data, newMod.data)
  })

  it('Should retrieve the created module entry', async () => {
    const result = await api.get('/mods')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some((mod) => mod.mod === 'mod-1' && mod.data === 'Sample module data'),
      true
    )
  })

  it('Should not allow duplicate module creation', async () => {
    const result = await api.post('/mod', newMod)

    assert.equal(result[0], 400)
  })

  it('Should delete a module entry', async () => {
    const mods = await api.get('/mods')
    const modToDelete = mods[1].find((mod) => mod.mod === 'mod-1')
    const result = await api.delete(`/mods/${modToDelete.mod}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the module entry was deleted', async () => {
    const result = await api.get('/mods')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((mod) => mod.mod === 'mod-1'),
      false
    )
  })
})

describe('Inventory Modvars API Tests', () => {
  it('Should create a new inventory modvar entry', async () => {
    const result = await api.post('/modvar', newModVar)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newModVar.id)
    assert.equal(d.val, newModVar.val)
    assert.equal(d.info, newModVar.info)
    assert.equal(d.mod, newModVar.mod)
  })

  it('Should retrieve the created inventory modvar entry', async () => {
    const result = await api.get('/modvars')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some(
        (modvar) =>
          modvar.id === 'var-1' &&
          modvar.val === 'Sample value' &&
          modvar.info === 'Sample info' &&
          modvar.mod === 'mod-1'
      ),
      true
    )
  })

  it('Should not allow duplicate inventory modvar creation', async () => {
    const result = await api.post('/modvar', newModVar)

    assert.equal(result[0], 400)
  })

  it('Should delete an inventory modvar entry', async () => {
    const modvars = await api.get('/modvars')
    const modVarToDelete = modvars[1].find((modvar) => modvar.id === 'var-1')
    const result = await api.delete(`/modvars/${modVarToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the inventory modvar entry was deleted', async () => {
    const result = await api.get('/modvars')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((modvar) => modvar.id === 'var-1'),
      false
    )
  })
})

describe('Inventory Hostvars API Tests', () => {
  it('Should create a new inventory hostvar entry', async () => {
    const result = await api.post('/hostvar', newHostVar)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newHostVar.id)
    assert.equal(d.key, newHostVar.key)
    assert.equal(d.val, newHostVar.val)
    assert.equal(d.info, newHostVar.info)
    assert.equal(d.host, newHostVar.host)
  })

  it('Should retrieve the created inventory hostvar entry', async () => {
    const result = await api.get('/hostvars')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some(
        (hostvar) =>
          hostvar.key === 'host-key-1' &&
          hostvar.val === 'Sample value' &&
          hostvar.info === 'Sample info' &&
          hostvar.host === 'host-1'
      ),
      true
    )
  })

  it('Should not allow duplicate inventory hostvar creation', async () => {
    const result = await api.post('/hostvar', newHostVar)

    assert.equal(result[0], 400)
  })

  it('Should delete an inventory hostvar entry', async () => {
    const hostvars = await api.get('/hostvars')
    const hostVarToDelete = hostvars[1].find((hostvar) => hostvar.key === 'host-key-1')
    const result = await api.delete(`/hostvars/${hostVarToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the inventory hostvar entry was deleted', async () => {
    const result = await api.get('/hostvars')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((hostvar) => hostvar.key === 'host-key-1'),
      false
    )
  })
})

describe('Inventory Modfiles API Tests', () => {
  it('Should create a new inventory modfile entry', async () => {
    const result = await api.post('/modfile', newModFile)
    const d = result[1]

    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.id, newModFile.id)
    assert.equal(d.mod, newModFile.mod)
    assert.equal(d.folder, newModFile.folder)
    assert.equal(d.file, newModFile.file)
    assert.equal(d.content, newModFile.content)
    assert.equal(d.source, newModFile.source)
  })

  it('Should retrieve the created inventory modfile entry', async () => {
    const result = await api.get('/modfiles')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 0, true)
    assert.equal(
      d.some(
        (modfile) =>
          modfile.mod === 'mod-1' &&
          modfile.folder === 'folder-1' &&
          modfile.file === 'file-1.txt' &&
          modfile.content === 'Sample content' &&
          modfile.source === 'Sample source'
      ),
      true
    )
  })

  it('Should not allow duplicate inventory modfile creation', async () => {
    const result = await api.post('/modfile', newModFile)

    assert.equal(result[0], 400)
  })

  it('Should delete an inventory modfile entry', async () => {
    const modfiles = await api.get('/modfiles')
    const modFileToDelete = modfiles[1].find((modfile) => modfile.id === 1)
    const result = await api.delete(`/modfiles/${modFileToDelete.id}`)

    assert.equal(result[0], 204)
  })

  it('Should confirm the inventory modfile entry was deleted', async () => {
    const result = await api.get('/modfiles')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(
      d.some((modfile) => modfile.id === 1),
      false
    )
  })
})
