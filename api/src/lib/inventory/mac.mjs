// Utils
import { log, utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultsAsList } from './shared.mjs'

/**
 * Constructor for a Mac instance
 *
 * @param {string} mac - The Mac to preset this for reading
 */
export function Mac(mac = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', mac)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a mac
 *
 * @param {object} params  - All params as an object
 * @param {string} mac - The mac address
 * @return {Mac} this - The Mac instance
 */
Mac.prototype.create = async function (mac) {
  if (!mac) {
    return false
  }

  const sql = `INSERT INTO inventory_macs(mac) VALUES (:mac)`

  const params = { mac }

  try {
    const result = await utils.db.write(sql, params)
    const created =
      Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id

    return !!created
  } catch (err) {
    return false
  }
}

/*
 * Set the mac
 */
Mac.prototype.setMac = function (mac) {
  return mac === undefined ? this : this.setRecordField('mac', mac).setSaved(false)
}

/*
 * Export the mac data
 */
Mac.prototype.asData = async function () {
  /*
   * Do not bother without an mac
   */
  if (!this.getId()) return this.setError('You must provide an mac')

  /*
   * Read from database or return local if there's unsaved changes
   */
  if (this.getSaved()) await this.read()

  return { mac: this.getId(), ...this.getRecord() }
}
/*
 * Set the mac data
 */
Mac.prototype.fromData = function ({ mac }) {
  if (mac) this.setRecordField('mac', mac)

  return this
}

/**
 * Save a mac
 *
 * @param {string} mac - The Mac address
 */
Mac.prototype.save = async function () {
  /*
   * Do not bother without an mac
   */
  if (!this.getId()) return this.setError('You must provide an mac')

  /*
   * Update database
   */
  let result = false
  try {
    const data = { mac: this.getId(), ...this.getRecord() }
    result = await utils.db.write(
      `INSERT INTO inventory_macs(${Object.keys(data).join(', ')}) ` +
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
 * Delete a mac
 */
Mac.prototype.delete = async function () {
  /*
   * Do not bother without an mac
   */
  if (!this.getId()) return this.setError('You must provide an mac')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_macs WHERE mac = :mac`, {
      mac: this.getId(),
    })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a mac
 *
 * @param {string} mac - The Mac address
 */
Mac.prototype.read = async function (mac) {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_macs WHERE mac=:mac`, {
    mac: mac,
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one mac in loadMac. This is unexpected.`)
    return false
  }
}

/**
 * List all MAC records
 */
Mac.prototype.list = async function () {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_macs ORDER BY mac`)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to see if a MAC is available
 *
 * @param {string} mac - The mac MAC
 * @return {object} available - true if it is available, false if not
 */
Mac.prototype.isAvailable = async function (mac) {
  const [status, result] = await utils.db.read(`SELECT mac FROM inventory_macs where mac=:mac`, {
    mac,
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
Mac.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Mac.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Mac.prototype.getError = function () {
  return this.error
}

// Sets the internal mac field
Mac.prototype.setId = function (mac) {
  this._id = mac

  return this
}

// Gets the internal id field
Mac.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Mac.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Mac.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Mac.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Mac.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Mac.prototype.getSaved = function () {
  return this._saved
}
