import Joi from 'joi'
import { fromEnv } from '@morio/lib/env'

const shared = {}

/*
 * This describes the schema of request objects
 */
export const requestSchema = {
  morio: {
    configuration: Joi.object({
      config: Joi.object(),
    }),
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
