import { defaults } from '@morio/defaults'

/**
 * Helper method to merge environment and defaults
 *
 * If an environemnt variable with name key is set, this wil return it
 * If not, it will return the default
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @return {mixed} value - The value in the environment variable of default
 */
export const fromEnv = (key) =>
  typeof process.env[key] === 'undefined' ? defaults[key] : process.env[key]
