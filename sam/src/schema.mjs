import Joi from 'joi'
import { fromEnv } from '#shared/env'

/*
 * Some shared schema objects
 */
const containerRead = Joi.object({ id: Joi.string().required() })

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
  },
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
