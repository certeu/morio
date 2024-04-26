import Joi from 'joi'

/*
 * This describes the schema of request objects
 */
export const requestSchema = {
  docker: {
    pull: Joi.object({
      tag: Joi.string().required(),
    }),
    container: {
      inspect: Joi.object({
        id: Joi.string().required(),
      }),
      logs: Joi.object({
        id: Joi.string().required(),
      }),
      stats: Joi.object({
        id: Joi.string().required(),
      }),
    },
    image: {
      inspect: Joi.object({
        id: Joi.string().required(),
      }),
    },
    network: {
      inspect: Joi.object({
        id: Joi.string().required(),
      }),
      remove: Joi.object({
        id: Joi.string().required(),
      }),
    },
  },
  decrypt: Joi.object({
    iv: Joi.string().required(),
    ct: Joi.string().required(),
  }),
}

/*
 * This describes the schema of response objects
 */
export const responseSchema = {
  status: Joi.object({
    name: Joi.string(),
    about: Joi.string(),
    version: Joi.string(),
    uptime: Joi.string(),
    uptime_seconds: Joi.number(),
    setup: Joi.bool(),
  }),
}

/*
 * This describes the schema of error responses
 */
export const errorsSchema = Joi.object({ errors: Joi.array().items(Joi.string()) })
