import Joi from 'joi'
import { roles } from '#config/roles'
import { isRoleAvailable, currentUser, currentProvider } from '../rbac.mjs'
import { randomString, hash, hashPassword } from '#shared/crypto'
import { store } from '../lib/store.mjs'
import { validateSchema } from '../lib/validation.mjs'
import { loadAccount, saveAccount, loadAccountApikeys } from '../lib/account.mjs'
import { mfa } from '../lib/mfa.mjs'

/**
 * This account controller handles accounts in Morio
 *
 * @returns {object} Controller - The account controller object
 */
export function Controller() {}

/**
 * List accounts
 *
 * This lists all accounts known to Morio.
 * An account can be either a local account (this one has the most
 * features) or on login via an identity provider, an account is
 * also created.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.list = async (req, res) => {
  const found = await store.rpkv.find('morio_accounts', new RegExp(`.*`))
  const accounts = []
  for (const [id, data] of Object.entries(found)) {
    const provider = id.split('.')[0]
    const username = id.split('.').slice(1).join('.')
    accounts.push({ id, provider, username, ...data })
  }

  return res.send(accounts)
}

/**
 * Create account
 *
 * The only type you can create is a local account.
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.username - The username
 * @param {string} req.body.about - Info about the account (optional)
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.create = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.body, schema.createAccount)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Does this user exist?
   */
  const exists = await loadAccount('local', valid.username)
  if (exists) {
    /*
     * A user with sufficient privileges can overwrite the account
     */
    if (valid.overwrite && isRoleAvailable(req, 'operator')) {
      store.log.debug(`Overwritting ${valid.provider}.${valid.username}`)
    } else return res.status(409).send({ error: 'Account exists' })
  }

  /*
   * Create the account
   */
  const invite = randomString(24)
  await saveAccount('local', valid.username, {
    about: valid.about,
    invite: hash(invite),
    status: 'pending',
    role: valid.role,
    createdBy: currentUser(req),
    createdAt: Date.now(),
  })

  return res.send({
    result: 'success',
    data: {
      ...valid,
      invite,
      inviteUrl: `https://${store.config.deployment.fqdn}/morio/invite/${valid.username}-${invite}`,
    },
  })
}

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
Controller.prototype.createApikey = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.body, schema.createApikey)
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
   * Create the API key, which is just an account really
   */
  const key = randomString(16)
  const secret = randomString(48)
  const data = {
    name: valid.name,
    secret: hashPassword(secret),
    status: 'active',
    createdBy: currentUser(req),
    role: valid.role,
    createdAt: Date.now(),
    expiresAt: Number(Date.now()) + Number(valid.expires) * 86400000, // ms in a day
  }

  await saveAccount('apikey', key, data)

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
Controller.prototype.listApikeys = async (req, res) => {
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
Controller.prototype.updateApikey = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.params, schema.updateApikey)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Get the current user
   */
  const user = currentUser(req)

  /*
   * Fet the key with a filter method
   */
  const key = await loadAccount('apikey', valid.key)

  /*
   * Is this is a key not created by the current user, you need
   * operator or higher as a role
   */
  if (key.createdBy !== currentUser(req) && !isRoleAvailable(req, 'operator')) {
    return res.status(403).send({ error: 'Access Denied' })
  }

  /*
   * Sounds good, handle the action
   */
  let secret
  if (valid.action === 'rotate') {
    secret = randomString(48)
    key.secret = hashPassword(secret)
  } else if (['disable', 'enable'].includes(valid.action)) {
    key.status = valid.action === 'enable' ? 'active' : 'disabled'
  }

  /*
   * Store update key
   */
  await saveAccount('apikey', valid.key, {
    ...key,
    updatedBy: user,
    updatedAt: Date.now(),
  })

  /*
   * Keep the secret out of the returned data unless we just created it
   */
  if (valid.action !== 'rotate') delete key.secret
  else key.secret = secret

  return res.send({ result: 'success', data: { ...key, key: valid.key } })
}

/**
 * Remove an API key

 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.removeApikey = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.params, schema.removeApikey)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Get the current user
   */
  const user = currentUser(req)

  /*
   * Fet the key with a filter method
   */
  const key = await loadAccount('apikey', valid.key)

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
  await saveAccount('apikey', valid.key, {
    ...key,
    status: 'deleted',
    removedBy: user,
    removedAt: Date.now(),
  })

  return res.status(204).send()
}

/**
 * Activate account
 *
 * The only type you can activate is a local account.
 * Note that this does not actually activate the account (yet).
 * Instead, it sets up MFA. When that is activated/configure, the
 * account becomes active. See activateMfa()
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.invite - The invite code
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.activateAccount = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.body, schema.activateAccount)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Does this account exist and is it in pending state??
   */
  const pending = await loadAccount('local', valid.username)
  if (!pending) return res.status(404).send({ error: 'Account not found' })
  if (pending.status !== 'pending')
    return res.status(400).send({ error: 'Account not in pending state' })

  /*
   * Does the invite match?
   */
  if (pending.invite !== hash(req.body.invite))
    return res.status(400).send({ error: 'Invite mismatch' })

  /*
   * MFA is mandatory for local accounts. So set it up
   */
  const result = await mfa.enroll(valid.username)

  /*
   * Update the account, with MFA secret
   */
  await saveAccount('local', valid.username, {
    ...pending,
    mfa: await store.encrypt(result.secret),
  })

  /*
   * Return the QR code and other relevant data
   */
  return res.send({
    result: 'success',
    data: result,
  })
}

/**
 * Activate MFA on an account
 *
 * The only type you can activate is a local account.
 * This actually activates the account after confirming MFA is
 * setup properly. It also generates scratch codes.
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.invite - The invite code
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.activateMfa = async (req, res) => {
  /*
   * Validate input
   */
  const [valid] = await validateSchema(req.body, schema.activateMfa)
  if (!valid) return res.status(400).send({ error: 'Validation failed' })

  /*
   * Does this account exist and is it in pending state with an MFA secret set?
   */
  const pending = await loadAccount('local', valid.username)
  if (!pending) return res.status(404).send({ error: 'Account not found' })
  if (pending.status !== 'pending')
    return res.status(400).send({ error: 'Account not in pending state' })
  if (!pending.mfa) return res.status(400).send({ error: 'Account does not have MFA setup' })

  /*
   * Does the invite match?
   */
  if (pending.invite !== hash(req.body.invite))
    return res.status(400).send({ error: 'Invite mismatch' })

  /*
   * Verify MFA token
   */
  const result = await mfa.verify(valid.token, await store.decrypt(pending.mfa), [])
  if (!result) return res.status(400).send({ error: 'Invalid MFA token' })

  /*
   * Also generate scratch codes because we've all lost our phone at one point
   */
  const scratchCodes = [1, 2, 3].map(() => randomString(32))

  /*
   * Update the account, with scratch codes and pasword,  and set status to active
   * While we're at it, remove the invite code
   */
  const data = {
    ...pending,
    scratchCodes: scratchCodes.map((code) => hash(code)),
    password: hashPassword(valid.password),
    status: 'active',
  }
  delete data.invite
  await saveAccount('local', valid.username, data)

  /*
   * Return the scratch codes
   */
  return res.send({
    result: 'success',
    data: { scratchCodes },
  })
}

const schema = {
  createAccount: Joi.object({
    username: Joi.string().required(),
    about: Joi.string().optional().allow(''),
    provider: Joi.string().valid('local').required(),
    role: Joi.string()
      .valid(...roles)
      .required(),
    overwrite: Joi.boolean().valid(true, false).optional(),
  }),
  activateAccount: Joi.object({
    username: Joi.string().required().min(1),
    invite: Joi.string().required().length(48),
    provider: Joi.string().required().valid('local'),
  }),
  activateMfa: Joi.object({
    username: Joi.string().required().min(1),
    invite: Joi.string().required().length(48),
    token: Joi.string().required(),
    password: Joi.string().required(),
    provider: Joi.string().valid('local').required(),
  }),
  createApikey: Joi.object({
    name: Joi.string().required().min(2),
    expires: Joi.number().required().min(1).max(730),
    role: Joi.string()
      .required()
      .valid(...roles),
    overwrite: Joi.boolean().valid(true, false).optional(),
  }),
  updateApikey: Joi.object({
    key: Joi.string().required(),
    action: Joi.number().required().valid('rotate', 'disable', 'enable'),
  }),
  removeApikey: Joi.object({
    key: Joi.string().required(),
  }),
}
