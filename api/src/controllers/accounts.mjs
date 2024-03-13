import Joi from 'joi'
import { randomString, hash, hashPassword } from '#shared/crypto'
import { store } from '../lib/store.mjs'
import { validateSchema } from '../lib/validation.mjs'
import { loadAccount, saveAccount } from '../lib/account.mjs'
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
  if (exists) return res.status(409).send({ error: 'Account exists' })

  /*
   * Create the account
   */
  const invite = randomString(24)
  await saveAccount('local', valid.username, { about: valid.about, invite, status: 'pending' })

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
   * MFA is mandatory for local accounts. So set it up
   */
  const result = await mfa.enroll(valid.username)

  /*
   * Update the account, with MFA secret
   */
  await saveAccount('local', valid.username, {
    ...pending,
    mfa: result.secret,
  })

  /*
   * Return the QR code
   */
  return res.send({
    result: 'success',
    data: { qrcode: result.qrcode },
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
   * Verify MFA token
   */
  const result = await mfa.verify(valid.token, pending.mfa, [])
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
    provider: Joi.string().valid('local'),
  }),
  activateAccount: Joi.object({
    username: Joi.string().required().min(1),
    invite: Joi.string().required().length(48),
    provider: Joi.string().valid('local'),
  }),
  activateMfa: Joi.object({
    username: Joi.string().required().min(1),
    invite: Joi.string().required().length(48),
    token: Joi.string().required(),
    password: Joi.string().required(),
    provider: Joi.string().valid('local'),
  }),
}
