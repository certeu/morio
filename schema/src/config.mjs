import Joi from 'joi'
import { deployment } from './config.deployment.mjs'

export const config = Joi.object({
  deployment,
})
