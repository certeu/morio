// pkgs/node-red-contrib-storage-rqlite/rqlite-storage.mjs

import fetch from 'node-fetch'

const logPrefix = '[rqlite-storage]'

function log(...args) {
  console.log(logPrefix, ...args)
}

function createRqliteStorageClient(config = {}) {
  const host = config.host || 'http://localhost:4001'
  const basePath = `${host}/db` // Default rqlite API path

  async function query(sql, type = 'execute') {
    const url = `${basePath}/${type}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statements: Array.isArray(sql) ? sql : [sql] }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Query failed: ${res.status} - ${text}`)
    }

    const data = await res.json()
    return data.results
  }

  async function get(key) {
    const results = await query(
      `SELECT value FROM nodered_storage WHERE key = '${key.replace(/'/g, "''")}'`,
      'query'
    )
    if (results[0]?.values?.length > 0) {
      return JSON.parse(results[0].values[0][0])
    }
    return null
  }

  async function set(key, value) {
    const val = JSON.stringify(value).replace(/'/g, "''")
    await query(
      `INSERT OR REPLACE INTO nodered_storage (key, value) VALUES ('${key.replace(/'/g, "''")}', '${val}')`
    )
  }

  async function deleteKey(key) {
    await query(`DELETE FROM nodered_storage WHERE key = '${key.replace(/'/g, "''")}'`)
  }

  async function listKeys() {
    const results = await query(`SELECT key FROM nodered_storage`, 'query')
    return results[0]?.values?.map((v) => v[0]) || []
  }

  async function ensureTableExists() {
    await query(`CREATE TABLE IF NOT EXISTS nodered_storage (key TEXT PRIMARY KEY, value TEXT)`)
  }

  return {
    async init(settings) {
      await ensureTableExists()
      log('Storage initialized with host:', host)
    },
    getFlows: () => get('flows'),
    saveFlows: (flows) => set('flows', flows),
    getCredentials: () => get('credentials'),
    saveCredentials: (creds) => set('credentials', creds),
    getSettings: () => get('settings'),
    saveSettings: (settings) => set('settings', settings),
    getSessions: () => get('sessions'),
    saveSessions: (sessions) => set('sessions', sessions),
    getLibraryEntry: async (type, path) => get(`lib:${type}:${path}`),
    saveLibraryEntry: async (type, path, meta, body) => set(`lib:${type}:${path}`, { meta, body }),
  }
}

export default createRqliteStorageClient
