// Utils
import { utils } from '../utils.mjs'
// Load shared inventory code
import { addNonEnumProp, resultAsRecord, resultsAsList } from './shared.mjs'

/**
 * Constructor for a Ip instance
 *
 * @param {string} ip - The Ip to preset this for reading
 */
export function Ip(ip = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', ip)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Create a ip
 *
 * @param {object} params  - All params as an object
 * @param {string} ip - The ip ip
 * @param {string} version - The ip version
 * @return {Ip} this - The Ip instance
 */
Ip.prototype.create = async function ({ ip, version }) {
  /*
   * Do not bother without an ip
   */
  if (!ip && !this.getId()) return this.setError('You must provide an ip')

  /*
   * Insert into the database
   */
  let result = false
  try {
    result = await utils.db.write(`INSERT INTO inventory_ips(ip, version) VALUES(:ip, :version)`, {
      ip,
      version,
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
    ? this.setId(ip).setSaved(true).setError(false)
    : this.setError('Failed to create record')
}

/*
 * Set the ip
 */
Ip.prototype.setIp = function (ip) {
  return ip === undefined ? this : this.setRecordField('ip', ip).setSaved(false)
}

/*
 * Set the ip version
 */
Ip.prototype.setVersion = function (version) {
  return version === undefined ? this : this.setRecordField('version', version).setSaved(false)
}

/*
 * Export the ip data
 */
Ip.prototype.asData = async function () {
  /*
   * Do not bother without an ip
   */
  if (!this.getId()) return this.setError('You must provide an ip')

  /*
   * Read from database or return local if there's unsaved changes
   */
  if (this.getSaved()) await this.read()

  return { ip: this.getId(), ...this.getRecord() }
}
/*
 * Set the ip data
 */
Ip.prototype.fromData = function ({ ip, version }) {
  if (ip) this.setRecordField('ip', ip)
  if (version) this.setRecordField('version', version)

  return this
}

/**
 * Save a ip
 *
 * @param {string} ip - The Ip ip
 */
Ip.prototype.save = async function () {
  /*
   * Do not bother without an ip
   */
  if (!this.getId()) return this.setError('You must provide an ip')

  /*
   * Update database
   */
  let result = false
  try {
    const data = { ip: this.getId(), ...this.getRecord() }
    result = await utils.db.write(
      `INSERT INTO inventory_ips(${Object.keys(data).join(', ')}) ` +
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
 * Delete a ip
 */
Ip.prototype.delete = async function () {
  /*
   * Do not bother without an ip
   */
  if (!this.getId()) return this.setError('You must provide an ip')

  /*
   * Remove from database
   */
  let result = false
  try {
    result = await utils.db.write(`DELETE FROM inventory_ips WHERE ip = :ip`, { ip: this.getId() })
  } catch (err) {
    return this.setError(err)
  }

  return result?.[0] === 200 ? this.clear() : this.setError('Failed to delete record')
}

/**
 * Read a ip
 *
 * @param {string} ip - The Ip ip
 */
Ip.prototype.read = async function (ip = false) {
  /*
   * Do not bother without an ip
   */
  if (!ip && !this.getId()) return this.setError('You must provide an ip')

  /*
   * Read from database
   */
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_ips WHERE ip = :ip`, {
      ip: ip || this.getId(),
    })
    const data = resultAsRecord(result[1])
    if (data.ip) this.setId(data.ip)
    if (data.version) this.setRecordField('version', data.version)
    this.setSaved(true)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? this
    : this.setError('Failed to read record')
}

/**
 * List all IP records
 */
Ip.prototype.list = async function () {
  let result = false
  try {
    result = await utils.db.read(`SELECT * FROM inventory_ips ORDER BY ip`)
  } catch (err) {
    return this.setError(err)
  }

  return result && Array.isArray(result) && result[0] === 200
    ? result[1].results
    : this.setError('Failed to fetch IP list')
}

/**
 * Helper method to see if a IP is available
 *
 * @param {string} ip - The ip IP
 * @return {object} available - true if it is available, false if not
 */
Ip.prototype.isAvailable = async function (ip) {
  const [status, result] = await utils.db.read(`SELECT ip FROM inventory_ips where ip=:ip`, { ip })
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
Ip.prototype.clear = function () {
  this._id = false
  this._record = false
  this._saved = false
  this.error = false

  return this
}

// Sets the internal error field
Ip.prototype.setError = function (error) {
  this.error = error

  return this
}

// Gets the internal error field
Ip.prototype.getError = function () {
  return this.error
}

// Sets the internal id field
Ip.prototype.setId = function (id) {
  this._id = id

  return this
}

// Gets the internal id field
Ip.prototype.getId = function () {
  return this._id
}

// Sets the internal record
Ip.prototype.setRecord = function (record) {
  this._record = record

  return this
}

// Gets the internal record
Ip.prototype.getRecord = function () {
  return this._record
}

// Sets an internal record field
Ip.prototype.setRecordField = function (field, value) {
  if (typeof this.getRecord() !== 'object') this.setRecord({})
  this._record[field] = value

  return this
}

// Sets the internal saved field
Ip.prototype.setSaved = function (saved) {
  this._saved = saved

  return this
}

// Gets the internal saved field
Ip.prototype.getSaved = function () {
  return this._saved
}
