import Joi from 'joi'
import { roles } from '#config/roles'
import { isRoleAvailable, currentUser, currentProvider } from '../rbac.mjs'
import { uuid, randomString, hashPassword } from '#shared/crypto'
import { validateSchema } from '../lib/validation.mjs'
import { loadApikey, saveApikey, deleteApikey, loadAccountApikeys } from '../lib/apikey.mjs'
import { asTime } from '../lib/account.mjs'
import { utils, log } from '../lib/utils.mjs'

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
  const [valid, err] = (await utils.validate(`req.apikey.create`, req.body))
  if (!valid) return utils.sendErrorResponse(res, 'morio.api.schema.violation', '/apikey')

  /*
   * Only nominative accounts can create API keys
   * In other words, when the current user is authenticated with either
   * an API key or the Morio Root Token, we say no
   */
  if (['mrt', 'apikey'].includes(currentProvider(req)))
    return utils.sendErrorResponse(res, 'morio.api.nominative.account.required', '/apikey')

  /*
   * Does the user have permission to assign the requested role?
   */
  if (!isRoleAvailable(req, valid.role))
    return res.status(403).send({ error: 'The requested role exceeds your permission level' })

  /*
   * Create the API key
   */
  const key = uuid()
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

  const result = await saveApikey(key, data)

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
  const user = currentUser(req)
  const keys = await loadAccountApikeys(currentUser(req))

  log.todo({ keys, user: currentUser(req) })

  return keys
    ? res.send({ result: 'success', keys})
    : utils.sendErrorResponse(res, `morio.api.apikeys.list.failed`, '/apikeys')
}

/**
 * Update an API key
 *
 * There are only three actions one can take:
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
  const [valid, err] = (await utils.validate(`req.apikey.update`, req.body))
  if (!valid) return utils.sendErrorResponse(res, 'morio.api.schema.violation', '/apikey')

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
 * Delete an API key

 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.delete = async (req, res) => {
  /*
   * Validate input
   */
  const [valid, err] = (await utils.validate(`req.apikey.delete`, req.body))
  if (!valid) log.todo({ body: req.body, err})
  if (!valid) return utils.sendErrorResponse(res, 'morio.api.schema.violation', '/apikey')

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
   * Sounds good, delete the API key
   */
  const gone = await deleteApikey(valid.key)

  res.status(gone ? 204 : 500).send()
}

