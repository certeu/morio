// Utils
import { log, utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultsAsList } from './shared.mjs'

/**
 * Constructor for a Hostvar instance
 *
 * @param {string} id - The Hostvar id to preset this for reading
 */
export function Hostvar(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a hostvar
 *
 * @param {object} params  - All params as an object
 * @param {string} id - The Hostvar id
 * @param {string} key - The Hostvar key
 * @param {string} val - The Hostvar val
 * @param {string} info - The Hostvar info
 * @param {string} host - The Host name
 * @return {Hostvar} this - The Hostvar instance
 */
Hostvar.prototype.create = async function (id, key, val, info, host) {
  if (!id) {
    return false
  }

  const sql = `
    INSERT INTO inventory_hostvars(
      id, key, val, info, host
    ) VALUES (
      :id, :key, :val, :info, :host
    )
  `

  const params = {
    id,
    key,
    val,
    info,
    host,
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

/**
 * Helper method to update an inventory (host) hostvar
 *
 * @return {object} updated - true if it the hostvar is updated, false if not
 */
Hostvar.prototype.update = async function (id, key = '', val = '', info = '', host = '') {
  if (!id) return false

  // Run query
  const updateResult = await utils.db.write(
    `UPDATE inventory_hostvars SET key=:key, val=:val, info=:info, host=:host WHERE id=:id`,
    {
      key,
      val,
      info,
      host,
      id,
    }
  )

  if (updateResult.rowCount === 0) {
    return false
  }

  return await this.read(id)
}

/*
 * Set the hostvar key
 */
Hostvar.prototype.setKey = function (key) {
  return key === undefined ? this : this.setRecordField('key', key).setSaved(false)
}

/*
 * Set the hostvar val
 */
Hostvar.prototype.setVal = function (val) {
  return val === undefined ? this : this.setRecordField('val', val).setSaved(false)
}

/*
 * Set the hostvar info
 */
Hostvar.prototype.setInfo = function (info) {
  return info === undefined ? this : this.setRecordField('info', info).setSaved(false)
}

/*
 * Set the hostvar host
 */
Hostvar.prototype.setHost = function (host) {
  return host === undefined ? this : this.setRecordField('host', host).setSaved(false)
}

/*
 * Export the hostvar
 */
Hostvar.prototype.asData = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Read from database or return local if there's unsaved changes
   */
  if (this.getSaved()) await this.read()

  return { id: this.getId(), ...this.getRecord() }
}
/*
 * Set the hostvar
 */
Hostvar.prototype.fromData = function ({ id, key, val, info, host }) {
  if (id) this.setRecordField('id', id)
  if (key) this.setRecordField('key', key)
  if (val) this.setRecordField('val', val)
  if (info) this.setRecordField('info', info)
  if (host) this.setRecordField('host', host)

  return this
}

/**
 * Save a hostvar
 *
 * @param {string} id - The Hostvar id
 */
Hostvar.prototype.save = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Update database
   */
  let result = false
  try {
    const data = { id: this.getId(), ...this.getRecord() }
    result = await utils.db.write(
      `INSERT INTO inventory_hostvars(${Object.keys(data).join(', ')}) ` +
        `VALUES(${Object.keys(data)
          .map((field) => ':' + field)
          .join(', ')}) ` +
        'ON CONFLICT(id) DO UPDATE SET ' +
        Object.keys(data)
          .map((field) => `${field} = :${field}`)
          .join(', '),
      data
    )
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? this.setSaved(true).setError(false)
    : this.setError('Failed to update record')
}

/**
 * Delete a hostvar
 */
Hostvar.prototype.delete = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_hostvars WHERE id = :id`, {
      id: this.getId(),
    })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a hostvar
 *
 * @param {string} id - The Hostvar id
 */
Hostvar.prototype.read = async function (id) {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_hostvars WHERE id=:id`, {
    id,
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one hostvar in loadHostvar. This is unexpected.`)
    return false
  }
}

/**
 * List all Hostvar records
 */
Hostvar.prototype.list = async function () {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_hostvars ORDER BY id`)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to see if a Hostvar is available
 *
 * @param {string} id - The id Hostvar
 * @return {object} available - true if it is available, false if not
 */
Hostvar.prototype.isAvailable = async function (id) {
  const [status, result] = await utils.db.read(`SELECT id FROM inventory_hostvars where id=:id`, {
    id,
  })
  if (status === 200) {
    const hits = resultsAsList(result)
    return hits.length === 0
  }

  return false
}

/*
 * Internal methods
 */

// Clears internal fields
Hostvar.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Hostvar.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Hostvar.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Hostvar.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Hostvar.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Hostvar.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Hostvar.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Hostvar.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Hostvar.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Hostvar.prototype.getSaved = function () {
  return this._saved
}
