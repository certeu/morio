const axios = require('axios')
const fs = require('fs')
const path = require('path')

function RqliteStorage(settings) {
  const dbUrl = settings.rqliteUrl || 'http://localhost:4001'

  function get(key) {
    return axios
      .post(`${dbUrl}/db/query?pretty&timings`, {
        statements: [`SELECT data FROM nodered WHERE id = "${key}" LIMIT 1`],
      })
      .then((res) => {
        const row = res.data.results[0].rows[0]
        return row ? JSON.parse(row.data) : null
      })
      .catch(() => null)
  }

  function save(key, value) {
    const data = JSON.stringify(value)
    return axios.post(`${dbUrl}/db/execute?pretty`, {
      statements: [
        `CREATE TABLE IF NOT EXISTS nodered (id TEXT PRIMARY KEY, data TEXT)`,
        `INSERT OR REPLACE INTO nodered(id, data) VALUES("${key}", ?)`,
      ],
      parameters: [[data]],
    })
  }

  function deleteKey(key) {
    return axios.post(`${dbUrl}/db/execute?pretty`, {
      statements: [`DELETE FROM nodered WHERE id = "${key}"`],
    })
  }

  return {
    getFlows: () => get('flows'),
    saveFlows: (flows) => save('flows', flows),
    getCredentials: () => get('credentials'),
    saveCredentials: (creds) => save('credentials', creds),
    getSettings: () => get('settings'),
    saveSettings: (settings) => save('settings', settings),
    getSessions: () => get('sessions'),
    saveSessions: (sessions) => save('sessions', sessions),
    getLibraryEntry: (type, path) => get(`lib__${type}__${path}`),
    saveLibraryEntry: (type, path, meta, body) => save(`lib__${type}__${path}`, { meta, body }),
    deleteLibraryEntry: (type, path) => deleteKey(`lib__${type}__${path}`),
  }
}

module.exports = {
  init: function (settings) {
    return RqliteStorage(settings)
  },
}
