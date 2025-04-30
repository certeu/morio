// Utils
import { utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultAsRecord } from './shared.mjs'

/**
 * Constructor for a Modvar instance
 *
 * @param {string} id - The Modvar id to preset this for reading
 */
export function Modvar(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a modvar
 *
 * @param {object} params  - All params as an object
 * @param {string} id - The Modvar id
 * @param {string} val - The Modvar val
 * @param {string} info - The Modvar info
 * @param {string} mod - The Modvar module
 * @return {Modvar} this - The Modvar instance
 */
Modvar.prototype.create = async function ({ id, val, info, mod }) {
  /*
   * Do not bother without an id
   */
  if (!id && !this.getId()) return this.setError('You must provide an id')

  /*
   * Insert into the database
   */
  let result = false
  try {
    result = await utils.db.write(
      `INSERT INTO inventory_modvars(id, val, info, mod) VALUES(:id, :val, :info, :mod)`,
      { id, val, info, mod }
    )
  } catch (err) {
    return this.setError(err)
  }

  /*
   * If it worked, store the internal id
   */
  return result &&
    Array.isArray(result) &&
    result[0] === 200 &&
    result[1]?.results?.[0]?.last_insert_id
    ? this.setId(id).setSaved(true).setError(false)
    : this.setError('Failed to create record')
}

/*
 * Set the modvar val
 */
Modvar.prototype.setVal = function (val) {
  return val === undefined ? this : this.setRecordField('val', val).setSaved(false)
}

/*
 * Set the modvar info
 */
Modvar.prototype.setInfo = function (info) {
  return info === undefined ? this : this.setRecordField('info', info).setSaved(false)
}

/*
 * Set the modvar mod
 */
Modvar.prototype.setMod = function (mod) {
  return mod === undefined ? this : this.setRecordField('mod', mod).setSaved(false)
}

/*
 * Export the modvar
 */
Modvar.prototype.asData = async function () {
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
 * Set the modvar
 */
Modvar.prototype.fromData = function ({ id, val, info, mod }) {
  if (id) this.setRecordField('id', id)
  if (val) this.setRecordField('val', val)
  if (info) this.setRecordField('info', info)
  if (mod) this.setRecordField('mod', mod)

  return this
}

/**
 * Save a modvar
 *
 * @param {string} id - The Modvar id
 */
Modvar.prototype.save = async function () {
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
      `INSERT INTO inventory_modvars(${Object.keys(data).join(', ')}) ` +
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
 * Delete a modvar
 */
Modvar.prototype.delete = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_modvars WHERE id = :id`, {
      id: this.getId(),
    })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a modvar
 *
 * @param {string} id - The Modvar id
 */
Modvar.prototype.read = async function (id = false) {
  /*
   * Do not bother without an id
   */
  if (!id && !this.getId()) return this.setError('You must provide an id')

  /*
   * Read from database
   */
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_modvars WHERE id = :id`, {
      id: id || this.getId(),
    })
    const data = resultAsRecord(result[1])
    if (data.id) this.setId(data.id)
    if (data.val) this.setRecordField('val', data.val)
    if (data.info) this.setRecordField('info', data.info)
    if (data.mod) this.setRecordField('mod', data.mod)
    this.setSaved(true)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? this
    : this.setError('Failed to create record')
}

/**
 * List all Modvar records
 */
Modvar.prototype.list = async function () {
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_modvars ORDER BY mod`)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? result[1].results
    : this.setError('Failed to fetch OS list')
}

/**
 * Helper method to see if a Modvar is available
 *
 * @param {string} val - The Modvar val
 * @return {object} available - true if it is available, false if not
 */
Modvar.prototype.isAvailable = async function (val) {
  const [status, result] = await utils.db.read(`SELECT val FROM inventory_modvars where val=:val`, {
    val,
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
Modvar.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Modvar.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Modvar.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Modvar.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Modvar.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Modvar.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Modvar.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Modvar.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Modvar.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Modvar.prototype.getSaved = function () {
  return this._saved
}
