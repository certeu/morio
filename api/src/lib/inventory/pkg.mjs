// Utils
import { utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultAsRecord } from './shared.mjs'

/**
 * Constructor for a Pkg instance
 *
 * @param {string} id - The Pkg id to preset this for reading
 */
export function Pkg(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a package
 *
 * @param {object} params  - All params as an object
 * @param {string} id - The Pkg id
 * @param {string} name - The Pkg name
 * @param {string} id - The Pkg version
 * @return {Pkg} this - The Pkg instance
 */
Pkg.prototype.create = async function ({ id, name, version }) {
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
      `INSERT INTO inventory_pkgs(id, name, version) VALUES(:id, :name, :version)`,
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
 * Set the package name
 */
Pkg.prototype.setName = function (name) {
  return name === undefined ? this : this.setRecordField('name', name).setSaved(false)
}

/*
 * Set the package version
 */
Pkg.prototype.setVersion = function (version) {
  return version === undefined ? this : this.setRecordField('version', version).setSaved(false)
}

/*
 * Export the package data
 */
Pkg.prototype.asData = async function () {
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
 * Set the package data
 */
Pkg.prototype.fromData = function ({ id, name, version }) {
  if (id) this.setRecordField('id', id)
  if (name) this.setRecordField('name', name)
  if (version) this.setRecordField('version', version)

  return this
}

/**
 * Save a package
 *
 * @param {string} id - The Pkg id
 */
Pkg.prototype.save = async function () {
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
      `INSERT INTO inventory_pkgs(${Object.keys(data).join(', ')}) ` +
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
 * Delete a package
 */
Pkg.prototype.delete = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_pkgs WHERE id = :id`, { id: this.getId() })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a package
 *
 * @param {string} id - The Pkg id
 */
Pkg.prototype.read = async function (id = false) {
  /*
   * Do not bother without an id
   */
  if (!id && !this.getId()) return this.setError('You must provide an id')

  /*
   * Read from database
   */
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_pkgs WHERE id = :id`, {
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
 * List all Package records
 */
Pkg.prototype.list = async function () {
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_pkgs ORDER BY name`)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? result[1].results
    : this.setError('Failed to fetch OS list')
}

/*
 * Internal methods
 */

// Clears internal fields
Pkg.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Pkg.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Pkg.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Pkg.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Pkg.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Pkg.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Pkg.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Pkg.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Pkg.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Pkg.prototype.getSaved = function () {
  return this._saved
}
