import Joi from 'joi'

/*
 * X.509 certificate
 */
export const certificate = Joi.object({
  cn: Joi.string().required().min(1),
  c: Joi.string().required().min(2).max(2).description('Country'),
  st: Joi.string().required().min(1),
  l: Joi.string().required().min(1),
  o: Joi.string().required().min(1),
  ou: Joi.string().required().min(1),
  san: Joi.array().required().unique().items(Joi.string().hostname()),
})
