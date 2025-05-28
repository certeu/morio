// Utils
import { log, utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultsAsList } from './shared.mjs'

/**
 * Constructor for a Modfile instance
 *
 * @param {string} id - The Modfile id to preset this for reading
 */
export function Modfile(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a modfile
 *
 * @param {object} params  - All params as an object
 * @param {string} id - The Modfile id
 * @param {string} mod - The Modfile mod
 * @param {string} folder - The Modfile folder
 * @param {string} file - The Modfile file
 * @param {string} content - The Modfile content
 * @param {string} source - The Modfile source
 * @return {Modfile} this - The Modfile instance
 */
Modfile.prototype.create = async function (id, mod, folder, file, content, source) {
  if (!id) {
    return false
  }

  const sql = `
    INSERT INTO inventory_modfiles(
      id, mod, folder, file, content, source
    ) VALUES (
      :id, :mod, :folder, :file, :content, :source
    )
  `

  const params = {
    id,
    mod,
    folder,
    file,
    content,
    source,
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
 * Helper method to update an inventory (host) modfile
 *
 * @return {object} updated - true if it the modfile is updated, false if not
 */
Modfile.prototype.update = async function (
  id,
  mod = '',
  folder = '',
  file = '',
  content = '',
  source = ''
) {
  if (!id) return false

  // Run query
  const updateResult = await utils.db.write(
    `UPDATE inventory_modfiles SET mod=:mod, folder=:folder, file=:file, content=:content, source=:source WHERE id=:id`,
    {
      mod,
      folder,
      file,
      content,
      source,
      id,
    }
  )

  if (updateResult.rowCount === 0) {
    return false
  }

  return await this.read(id)
}

/*
 * Set the modfile mod
 */
Modfile.prototype.setMod = function (mod) {
  return mod === undefined ? this : this.setRecordField('mod', mod).setSaved(false)
}

/*
 * Set the modfile folder
 */
Modfile.prototype.setFolder = function (folder) {
  return folder === undefined ? this : this.setRecordField('folder', folder).setSaved(false)
}

/*
 * Set the modfile file
 */
Modfile.prototype.setFile = function (file) {
  return file === undefined ? this : this.setRecordField('file', file).setSaved(false)
}

/*
 * Set the modfile content
 */
Modfile.prototype.setContent = function (content) {
  return content === undefined ? this : this.setRecordField('content', content).setSaved(false)
}

/*
 * Set the modfile source
 */
Modfile.prototype.setSource = function (source) {
  return source === undefined ? this : this.setRecordField('source', source).setSaved(false)
}

/*
 * Export the modfile
 */
Modfile.prototype.asData = async function () {
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
 * Set the modfile
 */
Modfile.prototype.fromData = function ({ id, mod, folder, file, content, source }) {
  if (id) this.setRecordField('id', id)
  if (mod) this.setRecordField('mod', mod)
  if (folder) this.setRecordField('folder', folder)
  if (file) this.setRecordField('file', file)
  if (content) this.setRecordField('content', content)
  if (source) this.setRecordField('source', source)

  return this
}

/**
 * Save a modfile
 *
 * @param {string} id - The Modfile id
 */
Modfile.prototype.save = async function () {
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
      `INSERT INTO inventory_modfiles(${Object.keys(data).join(', ')}) ` +
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
 * Delete a modfile
 */
Modfile.prototype.delete = async function () {
  /*
   * Do not bother without an id
   */
  if (!this.getId()) return this.setError('You must provide an id')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_modfiles WHERE id = :id`, {
      id: this.getId(),
    })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a modfile
 *
 * @param {string} id - The modfile id
 */
Modfile.prototype.read = async function (id) {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_modfiles WHERE id=:id`, {
    id,
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one modfile in loadModfile. This is unexpected.`)
    return false
  }
}

/**
 * List all Modfile records
 */
Modfile.prototype.list = async function () {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_modfiles ORDER BY id`)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to see if a Modfile is available
 *
 * @param {string} id - The id Modfile
 * @return {object} available - true if it is available, false if not
 */
Modfile.prototype.isAvailable = async function (id) {
  const [status, result] = await utils.db.read(`SELECT id FROM inventory_modfiles where id=:id`, {
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
Modfile.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Modfile.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Modfile.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Modfile.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Modfile.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Modfile.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Modfile.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Modfile.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Modfile.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Modfile.prototype.getSaved = function () {
  return this._saved
}
