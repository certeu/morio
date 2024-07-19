import { schema } from '../schema.mjs'

/**
 * Validates input
 *
 * The Joi library throws when validation fails
 * NodeJS does not like it (at all) when you throw in async code
 * We could validate in sync, but NodeJS is single-threaded so if we
 * can async it, we should.
 *
 * This is why this wrapper function provides a try...catch block for validation
 *
 * @param {string} key - The key in the schema object holding the Joi schema
 * @param {object] input - The input to validate
 * @return {object} valid - The result of the Joi validation
 */
export const validate = async (key, input) => {
  const target = schema[key]
  if (target) {
    let valid
    try {
      valid = await target.validateAsync(input)
    } catch (err) {
      return [false, err]
    }

    return [valid, null]
  }
}
