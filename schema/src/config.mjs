import Joi from 'joi'
import { morio } from './config.morio.mjs'

export const config = Joi.object({
  morio,
})
