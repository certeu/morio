import { readYamlFile } from './fs.mjs'

/*
 * Load defaults from disk
 */
export const defaults = await readYamlFile(
  'config/shared/morio-defaults.yaml',
  (err) => console.log('Unable to load defaults', err)
)

/**
 * Helper method to merge environment and defaults
 *
 * If an environemnt variable with name key is set, this wil return it
 * If not, it will return the default
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @return {mixed} value - The value in the environment variable of default
 */
export const fromEnv = key => (typeof process.env[key] === 'undefined')
  ? defaults[key]
  : process.env[key]
