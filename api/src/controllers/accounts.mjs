import Joi from 'joi'
import { randomString } from '#shared/crypto'
import { store } from '../lib/store.mjs'
import { validateSchema } from '../lib/validation.mjs'
import { loadAccount, saveAccount } from '../lib/account.mjs'

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
  const exists = await loadAccount('local', req.body.username)
  if (exists) return res.status(409).send({ error: 'Account exists' })

  /*
   * Create the account
   */
  const invite = randomString(24)
  await saveAccount('local', valid.username, { about: valid.about, invite, status: 'pending' })

  return res.send({
    result: 'success',
    data: valid,
    invite,
  })
}

const schema = {
  createAccount: Joi.object({
    username: Joi.string().required(),
    about: Joi.string().optional().allow(''),
    provider: Joi.string().valid('local'),
  }),
}
