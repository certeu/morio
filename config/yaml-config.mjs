import set from 'lodash.set'
import yaml from 'js-yaml'

/*
 * Don't allow setting of these top-level keys in the store
 */
const avoid = ['set', 'asYaml']

//////////////////////////////////////////////
//               CONSTRUCTOR                //
//////////////////////////////////////////////

/**
 * Constructor for a YamlConfig instance
 *
 * @constructor
 * @return {YamlConfig} this - The YamlConfig instance
 */
export function YamlConfig(log = false) {
  return this
}

//////////////////////////////////////////////
//            PUBLIC METHODS                //
//////////////////////////////////////////////

/**
 * Return contents as Yaml
 *
 * @return {string} this - The config as yaml
 */
YamlConfig.prototype.asYaml = function () {
  const data = {...this}

  return yaml.dump(data)
}

/**
 * Set key at path to value
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {YamlConfig} this - The YamlConfig instance
 */
YamlConfig.prototype.set = function (path, value) {
  set(this, path, value)

  return this
}