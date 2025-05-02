// Utils
import { utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultAsRecord, resultsAsList } from './shared.mjs'

/**
 * Constructor for a Os instance
 *
 * @param {string} id - The Os id to preset this for reading
 */
export function Os(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a os
 *
 * @param {object} params  - All params as an object
 * @param {string} id - The Os id
 * @param {string} name - The Os name
 * @param {string} version - The Os version
 * @return {Os} this - The Os instance
 */
Os.prototype.create = async function ({ id, name, version }) {
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
      `INSERT INTO inventory_oss(id, name, version) VALUES(:id, :name, :version)`,
      { id, name, version }
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
 * Set the os name
 */
Os.prototype.setName = function (name) {
  return name === undefined ? this : this.setRecordField('name', name).setSaved(false)
}

/*
 * Set the os version
 */
Os.prototype.setVersion = function (version) {
  return version === undefined ? this : this.setRecordField('version', version).setSaved(false)
}

/*
 * Export the os data
 */
Os.prototype.asData = async function () {
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
 * Set the os data
 */
Os.prototype.fromData = function ({ id, name, version }) {
  if (id) this.setRecordField('id', id)
  if (name) this.setRecordField('name', name)
  if (version) this.setRecordField('version', version)

  return this
}

/**
 * Save a os
 *
 * @param {string} id - The Os id
 */
Os.prototype.save = async function () {
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
      `INSERT INTO inventory_oss(${Object.keys(data).join(', ')}) ` +
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
 * Delete a os
 */
Os.prototype.delete = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_oss WHERE id = :id`, { id: this.getId() })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a os
 *
 * @param {string} id - The Os id
 */
Os.prototype.read = async function (id = false) {
  /*
   * Do not bother without an id
   */
  if (!id && !this.getId()) return this.setError('You must provide an id')

  /*
   * Read from database
   */
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_oss WHERE id = :id`, {
      id: id || this.getId(),
    })
    const data = resultAsRecord(result[1])
    if (data.id) this.setId(data.id)
    if (data.name) this.setRecordField('name', data.name)
    if (data.version) this.setRecordField('version', data.version)
    this.setSaved(true)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? this
    : this.setError('Failed to create record')
}

/**
 * List all OS records
 */
Os.prototype.list = async function () {
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_oss ORDER BY name`)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? result[1].results
    : this.setError('Failed to fetch OS list')
}

/**
 * Helper method to see if a OS is available
 *
 * @param {string} name - The os name
 * @return {object} available - true if it is available, false if not
 */
Os.prototype.isAvailable = async function (name) {
  const [status, result] = await utils.db.read(`SELECT name FROM inventory_oss where name=:name`, {
    name,
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
Os.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Os.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Os.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Os.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Os.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Os.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Os.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Os.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Os.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Os.prototype.getSaved = function () {
  return this._saved
}
