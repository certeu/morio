/*
 * Node-RED Storage Plugin for rqlite
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

class RqliteStorage {
  constructor(settings) {
    this.settings = settings || {}
    this.baseUrl = this.settings.rqliteUrl || 'http://morio-db:4001'
    this.tablePrefix = this.settings.tablePrefix || 'nodered_'
    this.initialized = false

    // Define table names
    this.tables = {
      flows: `${this.tablePrefix}flows`,
      credentials: `${this.tablePrefix}credentials`,
      settings: `${this.tablePrefix}settings`,
      sessions: `${this.tablePrefix}sessions`,
      library: `${this.tablePrefix}library`
    }
  }

  /**
   * Initialize the storage - create tables if they don't exist
   */
  async init() {
    if (this.initialized) return

    const createTableQueries = [
      // Flows table - stores flow configurations
      `CREATE TABLE IF NOT EXISTS ${this.tables.flows} (
        id INTEGER PRIMARY KEY,
        revision TEXT UNIQUE,
        flows TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Credentials table - stores encrypted credentials
      `CREATE TABLE IF NOT EXISTS ${this.tables.credentials} (
        node_id TEXT PRIMARY KEY,
        credentials TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Settings table - stores key-value settings
      `CREATE TABLE IF NOT EXISTS ${this.tables.settings} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sessions table - stores user session data
      `CREATE TABLE IF NOT EXISTS ${this.tables.sessions} (
        session_id TEXT PRIMARY KEY,
        user_id TEXT,
        data TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Library table - stores reusable flow components
      `CREATE TABLE IF NOT EXISTS ${this.tables.library} (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        meta TEXT,
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, path)
      )`
    ]

    try {
      await this._execute(createTableQueries)
      this.initialized = true
      console.log(`[morio-storage] Initialized with table prefix: ${this.tablePrefix}`)
    } catch (error) {
      console.error('[morio-storage] Failed to initialize:', error)
      throw error
    }
  }

  /**
   * Execute SQL queries against rqlite
   */
  async _execute(queries) {
    const url = new URL('/db/execute', this.baseUrl)

    // Handle both single queries and arrays of queries
    let queryData
    if (Array.isArray(queries)) {
      if (Array.isArray(queries[0])) {
        // Array of [query, param1, param2, ...] arrays
        queryData = queries
      } else {
        // Single query with parameters: [query, param1, param2, ...]
        queryData = [queries]
      }
    } else {
      // Single query string
      queryData = [queries]
    }

    const data = JSON.stringify(queryData)

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      const client = this.baseUrl.startsWith('https:') ? https : http
      const req = client.request(url, options, (res) => {
        let responseData = ''

        res.on('data', chunk => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData)
            if (result.error) {
              reject(new Error(result.error))
            } else {
              resolve(result)
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`))
          }
        })
      })

      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  /**
   * Query data from rqlite
   */
  async _query(sql, params = []) {
    const url = new URL('/db/query', this.baseUrl)

    // Format as rqlite expects: [sql, param1, param2, ...]
    const queryData = params.length > 0 ? [sql, ...params] : [sql]
    const data = JSON.stringify([queryData])  // Wrap in array for rqlite

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      const client = this.baseUrl.startsWith('https:') ? https : http
      const req = client.request(url, options, (res) => {
        let responseData = ''

        res.on('data', chunk => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData)
            if (result.error) {
              reject(new Error(result.error))
            } else {
              resolve(result)
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`))
          }
        })
      })

      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  /**
   * FLOWS STORAGE
   */
  async getFlows() {
    await this.init()

    const query = `SELECT flows FROM ${this.tables.flows} ORDER BY id DESC LIMIT 1`
    const result = await this._query(query)

    if (result.results && result.results[0] && result.results[0].values && result.results[0].values.length > 0) {
      const flows = result.results[0].values[0][0]
      return flows ? JSON.parse(flows) : []
    }

    return []
  }

  async saveFlows(flows, flowsRev) {
    await this.init()

    const revision = flowsRev || Date.now().toString()
    const query = `
      INSERT INTO ${this.tables.flows} (revision, flows, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `

    await this._execute([query, revision, JSON.stringify(flows)])

    // Keep only the last 10 revisions to prevent unbounded growth
    const cleanupQuery = `
      DELETE FROM ${this.tables.flows}
      WHERE id NOT IN (
        SELECT id FROM ${this.tables.flows} ORDER BY id DESC LIMIT 10
      )
    `
    await this._execute([cleanupQuery])

    return revision
  }

  /**
   * CREDENTIALS STORAGE
   */
  async getCredentials() {
    await this.init()

    const query = `SELECT node_id, credentials FROM ${this.tables.credentials}`
    const result = await this._query(query)

    const credentials = {}
    if (result.results && result.results[0] && result.results[0].values) {
      for (const row of result.results[0].values) {
        const nodeId = row[0]
        const creds = row[1]
        credentials[nodeId] = creds ? JSON.parse(creds) : {}
      }
    }

    return credentials
  }

  async saveCredentials(credentials) {
    await this.init()

    // Clear existing credentials
    await this._execute([`DELETE FROM ${this.tables.credentials}`])

    // Insert new credentials
    const queries = []
    for (const [nodeId, creds] of Object.entries(credentials)) {
      queries.push([
        `INSERT INTO ${this.tables.credentials} (node_id, credentials, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        nodeId,
        JSON.stringify(creds)
      ])
    }

    if (queries.length > 0) {
      await this._execute(queries)
    }
  }

  /**
   * SETTINGS STORAGE
   */
  async getSettings() {
    await this.init()

    const query = `SELECT key, value, type FROM ${this.tables.settings}`
    const result = await this._query(query)

    const settings = {}
    if (result.results && result.results[0] && result.results[0].values) {
      for (const row of result.results[0].values) {
        const key = row[0]
        const value = row[1]
        const type = row[2] || 'string'

        try {
          settings[key] = type === 'json' ? JSON.parse(value) : value
        } catch (err) {
          settings[key] = value
        }
      }
    }

    return settings
  }

  async saveSettings(settings) {
    await this.init()

    const queries = []
    for (const [key, value] of Object.entries(settings)) {
      const isObject = typeof value === 'object' && value !== null
      const serializedValue = isObject ? JSON.stringify(value) : String(value)
      const type = isObject ? 'json' : 'string'

      queries.push([
        `INSERT OR REPLACE INTO ${this.tables.settings} (key, value, type, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        key,
        serializedValue,
        type
      ])
    }

    if (queries.length > 0) {
      await this._execute(queries)
    }
  }

  /**
   * SESSIONS STORAGE
   */
  async getSessions() {
    await this.init()

    // Clean up expired sessions first
    await this._execute([
      `DELETE FROM ${this.tables.sessions} WHERE expires_at < CURRENT_TIMESTAMP`
    ])

    const query = `SELECT session_id, user_id, data FROM ${this.tables.sessions}`
    const result = await this._query(query)

    const sessions = {}
    if (result.results && result.results[0] && result.results[0].values) {
      for (const row of result.results[0].values) {
        const sessionId = row[0]
        const userId = row[1]
        const data = row[2]

        sessions[sessionId] = {
          user: userId,
          ...(data ? JSON.parse(data) : {})
        }
      }
    }

    return sessions
  }

  async saveSessions(sessions) {
    await this.init()

    // Clear existing sessions
    await this._execute([`DELETE FROM ${this.tables.sessions}`])

    // Insert new sessions
    const queries = []
    for (const [sessionId, sessionData] of Object.entries(sessions)) {
      const { user, ...data } = sessionData
      const expiresAt = sessionData.expires || null

      queries.push([
        `INSERT INTO ${this.tables.sessions} (session_id, user_id, data, expires_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        sessionId,
        user || null,
        JSON.stringify(data),
        expiresAt
      ])
    }

    if (queries.length > 0) {
      await this._execute(queries)
    }
  }

  /**
   * LIBRARY STORAGE
   */
  async getLibraryEntry(type, path) {
    await this.init()

    const query = `SELECT body FROM ${this.tables.library} WHERE type = ? AND path = ?`
    const result = await this._query(query, [type, path])

    if (result.results && result.results[0] && result.results[0].values && result.results[0].values.length > 0) {
      const body = result.results[0].values[0][0]
      return body ? JSON.parse(body) : null
    }

    return null
  }

  async saveLibraryEntry(type, path, meta, body) {
    await this.init()

    const name = path.split('/').pop() || path
    const query = `
      INSERT OR REPLACE INTO ${this.tables.library}
      (type, path, name, meta, body, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `

    await this._execute([
      query,
      type,
      path,
      name,
      JSON.stringify(meta),
      JSON.stringify(body)
    ])
  }

  async getLibraryEntries(type, path) {
    await this.init()

    const query = `
      SELECT name, path, meta FROM ${this.tables.library}
      WHERE type = ? AND path LIKE ?
      ORDER BY name
    `
    const pattern = path ? `${path}%` : '%'
    const result = await this._query(query, [type, pattern])

    const entries = []
    if (result.results && result.results[0] && result.results[0].values) {
      for (const row of result.results[0].values) {
        const name = row[0]
        const entryPath = row[1]
        const meta = row[2] ? JSON.parse(row[2]) : {}

        entries.push({
          fn: name,
          path: entryPath,
          ...meta
        })
      }
    }

    return entries
  }
}

/**
 * Create and return the storage interface
 */
function createRqliteStorage(settings) {
  const rqliteConfig = settings.rqlite || settings
  const storage = new RqliteStorage(rqliteConfig)

  return {
    init: () => storage.init(),

    getFlows: () => storage.getFlows(),
    saveFlows: (flows, flowsRev) => storage.saveFlows(flows, flowsRev),

    getCredentials: () => storage.getCredentials(),
    saveCredentials: (credentials) => storage.saveCredentials(credentials),

    getSettings: () => storage.getSettings(),
    saveSettings: (settings) => storage.saveSettings(settings),

    getSessions: () => storage.getSessions(),
    saveSessions: (sessions) => storage.saveSessions(sessions),

    getLibraryEntry: (type, path) => storage.getLibraryEntry(type, path),
    saveLibraryEntry: (type, path, meta, body) => storage.saveLibraryEntry(type, path, meta, body),
    getLibraryEntries: (type, path) => storage.getLibraryEntries(type, path)
  }
}

module.exports = createRqliteStorage
