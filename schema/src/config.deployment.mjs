import Joi from 'joi'

/*
 * Sizes of deployments we support
 * (single node or cluster size)
 */
const DEPLOYMENT_SIZES = [1, 3, 5, 7, 9, 11, 13, 15]

/*
 * deployment.display_name
 */
export const display_name = Joi.string().required().min(2).max(255)

/*
 * deployment.node_count
 */
export const node_count = Joi.number()
  .required()
  .valid(...DEPLOYMENT_SIZES)

/*
 * deployment.nodes
 */
export const nodes = Joi.array()
  .required()
  .unique()
  .length(Joi.ref('$deployment.node_count'))
  .items(Joi.string().hostname())

/*
 * deployment.cluster_name
 */
export const cluster_name = Joi.string().hostname()

/*
 * deployment
 */
export const deployment = Joi.object({
  display_name: Joi.string().required().min(2).max(255),
  node_count: Joi.number()
    .required()
    .valid(...DEPLOYMENT_SIZES),
  nodes: Joi.array()
    .required()
    .unique()
    .length(Joi.ref('$deployment.node_count'))
    .items(Joi.string().hostname()),
  cluster_name: Joi.string()
    .hostname()
    .when('$deployment.node_count', {
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
for (const [key, val] of Object.entries(keys)) flat[`deployment.${key}`] = val
