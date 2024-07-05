import set from 'lodash.set'
import unset from 'lodash.unset'
import get from 'lodash.get'
import { logger } from './logger.mjs'

/*
 * Don't allow setting of these top-level keys in the store
 */
const avoid = ['set', 'setIfUnset', 'push', 'unset', 'get', 'extend']

//////////////////////////////////////////////
//               CONSTRUCTOR                //
//////////////////////////////////////////////

/**
 * Constructor for a Store
 *
 * @constructor
 * @param {Object} log - Logger instance
 * @return {Store} this - The Store instance
 */
export function Store(log = false) {

  /*
   * The store is typically extended with a logger
   * Either one is passed in, or if not we attached a default one
   * In each case, it's a non-enumerable property
   */
  Object.defineProperty(this, 'log', {
    value: log ? log : logger,
    configurable: false,
    enumerable: false,
    writeable: false,
  })

  return this
}

//////////////////////////////////////////////
//            PUBLIC METHODS                //
//////////////////////////////////////////////

/**
 * Extend the store with additional methods
 *
 * @param {function} method - Method to add to the store (variadic)
 * @return {Store} this - The Store instance
 */
Store.prototype.extend = function (methods) {
  for (const [path, method] of methods) {
    if (avoid.indexOf(path) !== -1) this.log.warn(`You cannot overwrite \`store.${path}()\``)
    else {
      this.log.debug(`Extending store with \`${path}\``)
      set(this, path, (...args) => method(this, ...args))
    }
  }

  return this
}

/**
 * Retrieve a key from the store
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} dflt - Default method to return if key is undefined
 * @return {mixed} value - The value stored under key
 */
Store.prototype.get = function (path, dflt) {
  //console.log(`store.get: ${path}`)
  const val = get(this, path, dflt)
  /*
   * Help debugging by logging when a store value is missing
   * but do not include cache misses
   */
  if (val === undefined && Array.isArray(path) && path[0] !== 'cache')
    this.log.warn(`Store.get(key) on key \`${path}\`, which is undefined`)

  return val
}

/**
 * Adds a value to an array stored under path
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} values - One or more values to add (variadic)
 * @return {Store} this - The Store instance
 */
Store.prototype.push = function (path, ...values) {
  const arr = get(this, path)
  if (Array.isArray(arr)) return this.set(path, [...arr, ...values])
  else this.log.warn(`Store.push(value) on key \`${path}\`, but key does not hold an array`)

  return this
}

/**
 * Set key at path to value
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.set = function (path, value) {
  //console.log(`store.set: ${path}, ${JSON.stringify(value)}`)
  if (typeof value === 'undefined') this.log.warn(`Store.set(value) on key \`${path}\`, but value is undefined`)
  set(this, path, value)

  return this
}

/**
 * Set key at path to value, but only if it's not currently set
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.setIfUnset = function (path, value) {
  if (typeof value === 'undefined') this.log.warn(`Store.setIfUnset(value) on key \`${path}\`, but value is undefined`)
  if (typeof get(this, path) === 'undefined') return set(this, path, value)

  return this
}

/**
 * Remove the key at path
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.unset = function (path) {
  unset(this, path)

  return this
}

