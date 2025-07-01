/*
 * Node-RED Storage Plugin for rqlite
 *
 * This is tightly-coupled with Morio, and cannot be used as a
 * Rqlite storage plugin due to the way the connection and
 * authentication relies on Morio features.
 *
 * If you change that, this should work fine for any Rqlite setup.
 */

/*
 * Helper method to load the settings written to disk by core
 */
function loadSettings() {
  const settings = require(
    process.env['MORIO_EDA_PLUGIN_SETTINGS'] || `/etc/morio/eda/morio-settings.js`
  )

  return {
    ...settings.db,
    api: settings.api,
  }
}

/*
 * This is the actual storage plugin implementation
 */
function RqliteStorage() {
  const settings = loadSettings()
  this.settings = settings || {}
  this.tablePrefix = this.settings.tablePrefix || 'nodered_'
  this.connection = this.settings.connection
  this.initialized = false
  this.token = false

  /*
   * Define table names
   */
  this.tables = {
    flows: `${this.tablePrefix}flows`,
    credentials: `${this.tablePrefix}credentials`,
    settings: `${this.tablePrefix}settings`,
    sessions: `${this.tablePrefix}sessions`,
    library: `${this.tablePrefix}library`,
  }

  /*
   * Figure out whether to connect locally over the Docker network
   * Or via the db proxy
   */
  if (this.connection === 'local' && this.settings.local) {
    this.baseUrl = this.settings.local
  } else if (this.connection === 'ccdb' && this.settings.ccdb) {
    this.baseUrl = this.settings.ccdb
  } else throw 'Database connection needs to be one of local or ccdb'
}

/*
 * Initialize the storage - create tables if they don't exist
 */
RqliteStorage.prototype.init = async function() {
  if (this.initialized) return

  console.log(`[morio-storage] Initializing Morio storage driver for node-red`)
  console.log(`[morio-storage] Using database endpoint at ${this.baseUrl}`)

  const createTableQueries = [
    /*
     * Flows table - stores flow configurations
     */
    `CREATE TABLE IF NOT EXISTS ${this.tables.flows} (
      id INTEGER PRIMARY KEY,
      revision TEXT UNIQUE,
      flows TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    /*
     * Credentials table - stores encrypted credentials
     */
    `CREATE TABLE IF NOT EXISTS ${this.tables.credentials} (
      node_id TEXT PRIMARY KEY,
      credentials TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    /*
     * Settings table - stores key-value settings
     */
    `CREATE TABLE IF NOT EXISTS ${this.tables.settings} (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    /*
     * Sessions table - stores user session data
     */
    `CREATE TABLE IF NOT EXISTS ${this.tables.sessions} (
      session_id TEXT PRIMARY KEY,
      user_id TEXT,
      data TEXT NOT NULL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    /*
     * Library table - stores reusable flow components
     */
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
    )`,
  ]

  /*
   * Always wrap your async code in try...catch kids
   */
  try {
    console.log(`[morio-storage] Will create node-red tables. Table prefix is '${this.tablePrefix}'.`)
    await this._write(createTableQueries)
    this.initialized = true
    console.log(`[morio-storage] Initialized with table prefix: ${this.tablePrefix}`)
  } catch (error) {
    console.error('[morio-storage] Failed to initialize:', error)
    throw error
  }
}

/*
 * Grab JWT for cross-cluster database connection
 * Note that this is always loaded from the local API
 */
RqliteStorage.prototype._getCcdbToken = async function() {
  /*
   * Perhaps the token we have is still ok?
   * Note that we change for tokens older than 5 hours here
   * (18 million milliseconds) since ccdb tokens have a 6-hour
   * expiry, this should be fine
   */
  if (
    this.token &&
    this.token.jwt &&
    this.token.iat &&
    (Date.now() - this.token.iat < 18000000)
  ) return this.token.jwt
  // Nope, let's get a new one
  let token = false
  console.log(`[morio-storage] Requesting authentication token for cross-cluster database access`)
  try {
    const response = await fetch(`${this.settings.api}/token/ccdbauth`)
    const data = await response.json()
    if (data.jwt) token = data.jwt
  } catch (err) {
    console.log(`[morio-storage] Failed to load token. Please escalate to a human.`, err)
  }

  if (typeof token === 'string' && token.length > 0) {
    console.log(`[morio-storage] Authentication token loaded`)
    // Store for future use
    this.token = { jwt: token, iat: Date.now() }
  }

  return token
}

/*
 * This will add extra headers if we are using CCDB
 */
RqliteStorage.prototype._ccdbHeaders = async function() {
  const headers = {}
  if (this.connection === 'ccdb') {
    let token
    try {
      token = await this._getCcdbToken()
    }
    catch (err) {
      console.log(`[morio-storage] Token request error:`, err)
    }
    if (typeof token === 'string' && token.length > 0) headers.authorization = `Bearer ${token}`
    else console.log(`[morio-storage] Loaded token, but its format was unexpected. Please escalate to a human.`, { token })
  }

  return headers
}

/*
 * We need to handle both single queries and arrays of queries
 * and structure the data in the way Rqlite expects it.
 *
 * If queries holds and array of arrays, these are
 * each [query, param1, param2, ...] arrays.
 *
 * If it is an array of strings, this is a single
 * query with parameters: [query, param1, param2, ...]
 *
 * Or it can be just a string holding SQL.
 */
RqliteStorage.prototype._structureQueryData = function(queries) {
  return (Array.isArray(queries) && Array.isArray(queries[0]))
    ? [...queries]
    : [queries]
}

/*
 * Executes SQL queries against Morio's rqlite database
 *
 * This utilizes the Rqlite REST API, specifically the 'execute' endpoint (read/write).
 * This REST API which might be local (over the Docker network)
 * or remote in case this runs on a flanking node where no database
 * service is available.
 *
 * In the latter case, we need extraHeaders for authentication.
 */
RqliteStorage.prototype._query = async function(type='read', queries) {
  const extraHeaders = await this._ccdbHeaders()
  let result = false
  try {
    const response = await fetch(
      `${this.baseUrl}/db/${type === 'read' ? 'query' : 'execute'}`,
      {
        method: 'POST',
        headers: {
          ...extraHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this._structureQueryData(queries))
      }
    )
    try {
      result = await response.json()
    }
    catch (err) {
      console.log('[morio-storage]', err)
    }
  }
  catch (err) {
    console.log('[morio-storage]', err)
  }

  return result
}

/*
 * Read-only query method
 */
RqliteStorage.prototype._read = async function(queries) {
  return await this._query('read', queries)
}

/*
 * Read/Write query method
 */
RqliteStorage.prototype._write = async function(queries) {
  return await this._query('write', queries)
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagegetflows
 */
RqliteStorage.prototype.getFlows = async function() {
  await this.init()

  const query = `SELECT flows FROM ${this.tables.flows} ORDER BY id DESC LIMIT 1`
  const result = await this._read(query)

  if (
    result.results &&
    result.results[0] &&
    result.results[0].values &&
    result.results[0].values.length > 0
  ) {
    const flows = result.results[0].values[0][0]
    return flows ? JSON.parse(flows) : []
  }

  return []
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagesaveflowsflows
 */
RqliteStorage.prototype.saveFlows = async function(flows, flowsRev) {
  await this.init()

  const revision = flowsRev || Date.now().toString()
  const query = `
    INSERT INTO ${this.tables.flows} (revision, flows, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `
  await this._write([query, revision, JSON.stringify(flows)])

  /*
   * Clean up all but the last 10 revisions or risk being featured on hoarders
   */
  const cleanupQuery = `
    DELETE FROM ${this.tables.flows}
    WHERE id NOT IN (
      SELECT id FROM ${this.tables.flows} ORDER BY id DESC LIMIT 10
    )
  `
  await this._write(cleanupQuery)

  return revision
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagegetcredentials
 */
RqliteStorage.prototype.getCredentials = async function() {
  await this.init()

  const query = `SELECT node_id, credentials FROM ${this.tables.credentials}`
  const result = await this._read(query)

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

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagesavecredentialscredentials
 */
RqliteStorage.prototype.saveCredentials = async function(credentials) {
  await this.init()

  // Clear existing credentials
  await this._write(`DELETE FROM ${this.tables.credentials}`)

  // Insert new credentials
  const queries = []
  for (const [nodeId, creds] of Object.entries(credentials)) {
    queries.push([
      `INSERT INTO ${this.tables.credentials} (node_id, credentials, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      nodeId,
      JSON.stringify(creds),
    ])
  }

  if (queries.length > 0) {
    await this._write(queries)
  }
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagegetsettings
 */
RqliteStorage.prototype.getSettings = async function() {
  await this.init()

  const query = `SELECT key, value, type FROM ${this.tables.settings}`
  const result = await this._read(query)

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

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagesavesettingssettings
 */
RqliteStorage.prototype.saveSettings = async function(settings) {
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
      type,
    ])
  }

  if (queries.length > 0) {
    await this._write(queries)
  }
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagegetsettings
 */
RqliteStorage.prototype.getSessions = async function() {
  await this.init()

  /*
   * Clean up expired sessions prior to loading the sessions
   */
  await this._write(
    `DELETE FROM ${this.tables.sessions} WHERE expires_at < CURRENT_TIMESTAMP`
  )

  /*
   * Now grab the sessions and format them
   */
  const result = await this._read(`SELECT session_id, user_id, data FROM ${this.tables.sessions}`)
  const sessions = {}
  if (result.results && result.results[0] && result.results[0].values) {
    for (const row of result.results[0].values) {
      const sessionId = row[0]
      const userId = row[1]
      const data = row[2]

      sessions[sessionId] = {
        user: userId,
        ...(data ? JSON.parse(data) : {}),
      }
    }
  }

  return sessions
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagesavesettingssettings
 */
RqliteStorage.prototype.saveSessions = async function(sessions) {
  await this.init()

  /*
   * Clean up expired sessions prior to loading the sessions
   */
  await this._write(`DELETE FROM ${this.tables.sessions}`)

  /*
   * Now insert the new sessions
   */
  const queries = []
  for (const [sessionId, sessionData] of Object.entries(sessions)) {
    const { user, ...data } = sessionData
    const expiresAt = sessionData.expires || null
    queries.push([
      `INSERT INTO ${this.tables.sessions} (session_id, user_id, data, expires_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      sessionId,
      user || null,
      JSON.stringify(data),
      expiresAt,
    ])
  }

  if (queries.length > 0) await this._write(queries)
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagegetlibraryentrytypename
 */
RqliteStorage.prototype.getLibraryEntry = async function(type, path) {
  await this.init()

  const query = `SELECT body FROM ${this.tables.library} WHERE type = ? AND path = ?`
  const result = await this._read(query, [type, path])

  if (
    result.results &&
    result.results[0] &&
    result.results[0].values &&
    result.results[0].values.length > 0
  ) {
    const body = result.results[0].values[0][0]
    return body ? JSON.parse(body) : null
  }

  return null
}

/*
 * See: https://nodered.org/docs/api/storage/methods/#storagesavelibraryentrytypenamemetabody
 */
RqliteStorage.prototype.saveLibraryEntry = async function(type, path, meta, body) {
  await this.init()

  const name = path.split('/').pop() || path
  const query = `
    INSERT OR REPLACE INTO ${this.tables.library}
    (type, path, name, meta, body, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `
  await this._write([query, type, path, name, JSON.stringify(meta), JSON.stringify(body)])
}

/*
 * Create and return the storage interface
 *
 * See: https://nodered.org/docs/api/storage/
 */
function createRqliteStorage() {
  const storage = new RqliteStorage()

  /*
   * Let's keep the storage internals out of the returned object
   */
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
  }
}

module.exports = createRqliteStorage
