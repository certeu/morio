import Joi from 'joi'
import { fromEnv } from '@morio/lib/env'

/*
 * morio.display_name
 */
export const display_name = Joi.string().required().min(2).max(255)

/*
 * morio.node_count
 */
export const node_count = Joi.number()
  .required()
  .valid(...fromEnv('MORIO_NODES_VALID'))

/*
 * morio.nodes
 */
export const nodes = Joi.array()
  .required()
  .unique()
  .length(Joi.ref('node_count'))
  .items(Joi.string().hostname())

/*
 * morio.cluster_name
 */
export const cluster_name = Joi.string().hostname()

/*
 * morio
 */
export const morio = Joi.object({
  display_name: Joi.string().required().min(2).max(255),
  node_count: Joi.number()
    .required()
    .valid(...fromEnv('MORIO_NODES_VALID')),
  nodes: Joi.array()
    .required()
    .unique()
    .length(Joi.ref('node_count'))
    .items(Joi.string().hostname()),
  cluster_name: Joi.string()
    .hostname()
    .when('node_count', {
      is: Joi.number().max(1),
      then: Joi.forbidden(),
      otherwise: Joi.required(),
    }),
})

/*
 * Also export individual keys
 */
export const keys = {
  display_name,
  node_count,
  nodes,
  cluster_name,
}

/*
 * Also export a flat prefixed object
 */
export const flat = {}
for (const [key, val] of Object.entries(keys)) flat[`morio.${key}`] = val
