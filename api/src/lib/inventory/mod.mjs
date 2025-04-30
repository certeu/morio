// Utils
import { utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultAsRecord } from './shared.mjs'

/**
 * Constructor for a Mod instance
 *
 * @param {string} mod - The Mod to preset this for reading
 */
export function Mod(mod = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', mod)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a mod
 *
 * @param {object} params  - All params as an object
 * @param {string} mod - The mod name
 * @param {string} data - The mod data
 * @return {Mod} this - The Mod instance
 */
Mod.prototype.create = async function ({ mod, data }) {
  /*
   * Do not bother without a mod
   */
  if (!mod && !this.getId()) return this.setError('You must provide a mod')

  /*
   * Insert into the database
   */
  let result = false
  try {
    result = await utils.db.write(`INSERT INTO inventory_mods(mod, data) VALUES(:mod, :data)`, {
      mod,
      data,
    })
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
    ? this.setId(mod).setSaved(true).setError(false)
    : this.setError('Failed to create record')
}

/*
 * Set the mod
 */
Mod.prototype.setMod = function (mod) {
  return mod === undefined ? this : this.setRecordField('mod', mod).setSaved(false)
}

/*
 * Set the mod data
 */
Mod.prototype.setData = function (data) {
  return data === undefined ? this : this.setRecordField('data', data).setSaved(false)
}

/*
 * Export the mod data
 */
Mod.prototype.asData = async function () {
  /*
   * Do not bother without a mod
   */
  if (!this.getId()) return this.setError('You must provide a mod')

  /*
   * Read from database or return local if there's unsaved changes
   */
  if (this.getSaved()) await this.read()

  return { mod: this.getId(), ...this.getRecord() }
}
/*
 * Set the mod data
 */
Mod.prototype.fromData = function ({ mod, data }) {
  if (mod) this.setRecordField('mod', mod)
  if (data) this.setRecordField('data', data)

  return this
}

/**
 * Save a mod
 *
 * @param {string} mod - The Mod data
 */
Mod.prototype.save = async function () {
  /*
   * Do not bother without a mod
   */
  if (!this.getId()) return this.setError('You must provide an mod')

  /*
   * Update database
   */
  let result = false
  try {
    const data = { mod: this.getId(), ...this.getRecord() }
    result = await utils.db.write(
      `INSERT INTO inventory_mods(${Object.keys(data).join(', ')}) ` +
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
 * Delete a mod
 */
Mod.prototype.delete = async function () {
  /*
   * Do not bother without a mod
   */
  if (!this.getId()) return this.setError('You must provide an mod')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_mods WHERE mod = :mod`, {
      mod: this.getMod(),
    })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a mod
 *
 * @param {string} mod - The Mod data
 */
Mod.prototype.read = async function (mod = false) {
  /*
   * Do not bother without a mod
   */
  if (!mod && !this.getId()) return this.setError('You must provide a mod')

  /*
   * Read from database
   */
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_mods WHERE mod = :mod`, {
      mod: mod || this.getId(),
    })
    const data = resultAsRecord(result[1])
    if (data.mod) this.setId(data.mod)
    if (data.data) this.setRecordField('data', data.data)
    this.setSaved(true)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? this
    : this.setError('Failed to create record')
}

/**
 * List all Mod records
 */
Mod.prototype.list = async function () {
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_mods ORDER BY mod`)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? result[1].results
    : this.setError('Failed to fetch Mod list')
}

/**
 * Helper method to see if a Mod is available
 *
 * @param {string} mod - The mod MOD
 * @return {object} available - true if it is available, false if not
 */
Mod.prototype.isAvailable = async function (mod) {
  const [status, result] = await utils.db.read(`SELECT mod FROM inventory_mods where mod=:mod`, {
    mod,
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
Mod.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Mod.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Mod.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Mod.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Mod.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Mod.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Mod.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Mod.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Mod.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Mod.prototype.getSaved = function () {
  return this._saved
}
