// Utils
import { log, utils } from './utils.mjs'
import { addNonEnumProp, resultsAsList } from './inventory/shared.mjs'

/**
 * Constructor for a OidcClient instance
 *
 * @param {string} id - The Id to preset this for reading
 */
export function Client(id = false, account = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_account', account)
  addNonEnumProp(this, '_table', 'oidc_provider_clients')
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Helper method to list clients
 *
 * @return {object} keys - The OIDC clients for the account
 */
Client.prototype.list = async function () {
  const [status, result] = await utils.db.read(
    `SELECT * FROM ${this._table} WHERE created_by=:created_by`,
    { created_by: this._account }
  )

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to update a client
 *
 * @return {object} updated - true if it the client is updated, false if not
 */
Client.prototype.update = async function ({ name, by, uris }) {
  if (!this._id || !this._account) return false

  const updates = [`updated_by=:updated_by`, `updated_at=:updated_at`]
  const params = {
    id: this._id,
    updated_by: this._account,
    updated_at: new Date().toISOString().replace('T', ' ').replace('Z', ''),
  }
  if (name) {
    updates.push(`name=:name`)
    params.name = name
  }
  if (by) {
    updates.push(`by=:by`)
    params.by = by
  }
  if (Array.isArray(uris)) {
    updates.push(`redirect_uris=:redirect_uris`)
    params.redirect_uris = JSON.stringify(uris)
  }

  const updateResult = await utils.db.write(
    `UPDATE oidc_provider_clients SET ${updates.join(',')} WHERE id=:id`,
    params
  )

  if (updateResult.rowCount === 0) {
    return false
  }

  return await this.read()
}

/**
 * Helper method to see if a client ID is available
 *
 * @param {string} id - The client ID
 * @return {object} available - true if it is available, false if not
 */
Client.prototype.isAvailable = async function (id) {
  const [status, result] = await utils.db.read(
    `SELECT id FROM oidc_provider_clients where id=:id`,
    { id }
  )
  if (status === 200) {
    const hits = resultsAsList(result)
    return hits.length === 0
  }

  return false
}

/**
 * Helper method to load an OIDC client
 *
 * @param {string} id - The ID of the client
 * @return {object} data - The data saved for the client
 */
Client.prototype.read = async function () {
  const [status, result] = await utils.db.read(`SELECT * FROM oidc_provider_clients WHERE id=:id`, {
    id: this._id,
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return { ...found[0], redirect_uris: JSON.parse(found[0].redirect_uris) }
  else {
    log.warn(`Found more than one OIDC client. This is unexpected.`)
    return false
  }
}

Client.prototype.delete = async function () {
  const result = await utils.db.write(`DELETE FROM ${this._table} WHERE id = :id`, { id: this._id })

  return result
}

/**
 * Helper method to create an OIDC client
 *
 * @return {object} created - true if it is created, false if not
 */
Client.prototype.create = async function ({ name, by, uris }) {
  if (!this._id || !this._account) return false

  const sql = `
    INSERT INTO ${this._table}(
      id, name, by, redirect_uris, created_at, created_by
    ) VALUES (
      :id, :name, :by, :redirect_uris, :created_at, :created_by
    )
  `
  const params = {
    id: this._id,
    name,
    by,
    redirect_uris: JSON.stringify(uris),
    created_at: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    created_by: this._account,
  }

  try {
    const result = await utils.db.write(sql, params)
    const created =
      Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id

    return !!created
  } catch (err) {
    return false
  }
}
