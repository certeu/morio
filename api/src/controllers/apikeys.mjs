import Joi from 'joi'
import { roles } from '#config/roles'
import { isRoleAvailable, currentUser, currentProvider } from '../rbac.mjs'
import { randomString, hashPassword } from '#shared/crypto'
import { validateSchema } from '../lib/validation.mjs'
import { loadApikey, saveApikey, removeApikey, loadAccountApikeys } from '../lib/apikey.mjs'
import { asTime } from '../lib/account.mjs'

/**
 * This account controller handles apikeys in Morio
 *
 * @returns {object} Controller - The apikeys controller object
 */
export function Controller() {}

/**
 * Create an API key
 *
 * Stricly speaking, an API key is also an account
 * But it's a bit different in the sense that username & password
 * will be auto-generated.
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.name - The name for the API key
 * @param {string} req.body.expires - The amount of time the key is valid, in days
 * @param {string} req.body.role - The role to assign to the key
 * @param {object} res - The response object from Express
 */
Controller.prototype.create = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.body, schema.create)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Only nominative accounts can create API keys
   * In other words, when the current user is authenticated with either
   * an API key or the Morio Root Token, we say no
   */
  if (['mrt', 'apikey'].includes(currentProvider(req)))
    return res.status(403).send({ error: 'Only nominative accounts can create API keys' })

  /*
   * Does the user have permission to assign the requested role?
   */
  if (!isRoleAvailable(req, valid.role))
    return res.status(403).send({ error: 'The requested role exceeds your permission level' })

  /*
   * Create the API key
   */
  const key = randomString(16)
  const secret = randomString(48)
  const data = {
    name: valid.name,
    secret: hashPassword(secret),
    status: 'active',
    createdBy: currentUser(req),
    role: valid.role,
    createdAt: asTime(),
    expiresAt: asTime(Date.now() + Number(valid.expires) * 86400000), // ms in a day
  }

  await saveApikey(key, data)

  return res.send({
    result: 'success',
    data: { ...data, secret, key },
  })
}

/**
 * List API keys
 *
 * Lists the API keys for the current account
 *
 * There is no super efficient way to do this, we need to cycle
 * through the messages in the topic.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.list = async (req, res) => {
  /*
   * Fetch all keys with a filter method
   */
  const keys = await loadAccountApikeys(currentUser(req))

  /*
   * Parse them into a nice list
   */
  const list = (Object.keys(keys) || [])
    .filter((id) => keys[id].status !== 'deleted')
    .map((id) => {
      const data = {
        key: id.slice(7),
        ...keys[id],
      }
      delete data.secret

      return data
    })

  return res.send({
    result: 'success',
    keys: list,
  })
}

/**
 * Update an API key
 *
 * There are only four actions one can take:
 *   - rotate: Changes the key secret
 *   - disable: Sets status to 'disabled'
 *   - enable: Sets status to 'active'
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.update = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.params, schema.update)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Get the current user
   */
  const user = currentUser(req)

  /*
   * Fet the key with a filter method
   */
  const key = await loadApikey(valid.key)

  /*
   * Does the key exist
   */
  if (!key) return res.status(404).send().end()

  /*
   * Is this is a key not created by the current user, you need
   * operator or higher as a role
   */
  if (key.createdBy !== currentUser(req) && !isRoleAvailable(req, 'operator')) {
    return res.status(403).send({ error: 'Access Denied' })
  }

  /*
   * Keep track of what was updated
   */
  const updated = {
    key: valid.key,
    updatedBy: user,
    updatedAt: asTime(),
  }

  /*
   * Sounds good, handle the action
   */
  let secret
  if (valid.action === 'rotate') {
    secret = randomString(48)
    updated.secret = hashPassword(secret)
  } else if (['disable', 'enable'].includes(valid.action)) {
    updated.status = valid.action === 'enable' ? 'active' : 'disabled'
  }

  /*
   * Store update key
   */
  await saveApikey(valid.key, { ...key, ...updated })

  /*
   * Keep the secret out of the returned data unless we just created it
   */
  const data = { ...key, ...updated }
  if (updated.secret) data.secret = secret
  else delete data.secret

  return res.send({ result: 'success', data })
}

/**
 * Remove an API key

 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.remove = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.params, schema.remove)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Load the key with a filter method
   */
  const key = await loadApikey(valid.key)

  /*
   * Is this is a key not created by the current user, you need
   * operator or higher as a role
   */
  if (key.createdBy !== currentUser(req) && !isRoleAvailable(req, 'operator')) {
    return res.status(403).send({ error: 'Access Denied' })
  }

  /*
   * Sounds good, remove the API key
   */
  const gone = await removeApikey(valid.key)

  res.status(gone ? 204 : 500).send()
}

const schema = {
  create: Joi.object({
    name: Joi.string().required().min(2),
    expires: Joi.number().required().min(1).max(730),
    role: Joi.string()
      .required()
      .valid(...roles),
    overwrite: Joi.boolean().valid(true, false).optional(),
  }),
  update: Joi.object({
    key: Joi.string().required(),
    action: Joi.number().required().valid('rotate', 'disable', 'enable'),
  }),
  remove: Joi.object({
    key: Joi.string().required(),
  }),
}
