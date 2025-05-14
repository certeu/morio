// Utils
import { log, utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultsAsList } from './shared.mjs'

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
Pkg.prototype.create = async function (id, name, version) {
  if (!id) {
    return false
  }

  const sql = `
    INSERT INTO inventory_pkgs(
      id, name, version
    ) VALUES (
      :id, :name, :version
    )
  `

  const params = {
    id,
    name,
    version,
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
 * Helper method to update an inventory (host) pkg
 *
 * @return {object} updated - true if it the pkg is updated, false if not
 */
Pkg.prototype.update = async function (id, name = '', version = '') {
  if (!id) return false

  // Run query
  const updateResult = await utils.db.write(
    `UPDATE inventory_pkgs SET name=:name, version=:version WHERE id=:id`,
    {
      name,
      version,
      id,
    }
  )

  if (updateResult.rowCount === 0) {
    return false
  }

  return await this.read(id)
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
Pkg.prototype.read = async function (id) {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_pkgs WHERE id=:id`, {
    id,
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one pkg in loadPkg. This is unexpected.`)
    return false
  }
}

/**
 * List all Package records
 */
Pkg.prototype.list = async function () {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_pkgs ORDER BY id`)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to see if a Pkg is available
 *
 * @param {string} name - The pkg name
 * @return {object} available - true if it is available, false if not
 */
Pkg.prototype.isAvailable = async function (id) {
  const [status, result] = await utils.db.read(`SELECT id FROM inventory_pkgs where id=:id`, { id })
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
