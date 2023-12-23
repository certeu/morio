import { defaults } from '#defaults'

/**
 * Helper method to merge environment and defaults
 *
 * If an environemnt variable with name key is set, this wil return it
 * If not, it will return the default
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @param {string} case - Type of variable to cast the result to
 * @return {mixed} value - The value in the environment variable of default
 */
export const fromEnv = (key, cast = false) => {
  /*
   * Grab the result
   */
  const result = typeof process.env[key] === 'undefined' ? defaults[key] : process.env[key]

  /*
   * Optionally cast result as a specific type
   */
  if (cast === 'bool') return Boolean(result)
  if (cast === 'string') return String(result)
  if (cast === 'number') return Number(result)

  return result
}
