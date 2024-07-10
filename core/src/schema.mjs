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
  cluster: {
    join: Joi.object({
      you: Joi.string().required().hostname(),
      join: Joi.string().required().hostname(),
      cluster: Joi.string().required(),
      as: Joi.string().required().valid('node', 'flanking_node'),
      token: Joi.string().required(),
      settings: Joi.object({
        serial: Joi.number().required().min(172e10).max(199e10),
        data: Joi.object().required(),
      }),
      keys: Joi.object({
        jwt: Joi.string().required(),
        mrt: Joi.string().required(),
        public: Joi.string().required(),
        private: Joi.string().required(),
        deployment: Joi.string().required(),
      }),
      headers: Joi.object(),
    })
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
