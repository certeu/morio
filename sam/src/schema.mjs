import Joi from 'joi'
import { fromEnv } from '@morio/lib/env'

/*
 * This describes the schema of request objects
 */
export const requestSchema = {
  docker: {
    pull: Joi.object({
      tag: Joi.string().required(),
    }),
    getCommand: Joi.object({
      cmd: Joi.string()
        .required()
        .valid(...fromEnv('MORIO_SAM_DOCKER_GET_COMMANDS')),
    }),
    postCommand: Joi.object({
      cmd: Joi.string()
        .required()
        .valid(...fromEnv('MORIO_SAM_DOCKER_POST_COMMANDS')),
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
