import { log, utils } from '../lib/utils.mjs'
import { verifyToken } from './auth.mjs'
import { currentAccount } from '../rbac.mjs'
import { Client } from '../lib/oidc-clients.mjs'

/**
 * This controller handles OIDC provider endpoints
 *
 * @returns {object} Controller - The oidc controller object
 */
export function Controller() {}

/**
 * Initialized the OIDC flow
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.init = async function (req, res) {
  // Get the interaction details from OIDC provider
  try {
    const { uid, prompt, params } = await utils.oidcProvider.interactionDetails(req, res)
    // Load client info to show in the UI
    const client = new Client(params.client_id)
    const info = await client.read()

    return res.redirect(`/oidcui/${prompt.name}/?uid=${uid}&name=${info.name}&by=${info.by}`)
  } catch (err) {
    log.error(err)
  }

  // FIXME: Send proper error response
  return res.redirect(`/oidcui/error`)
}

/**
 * OIDC login
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.login = async function (req, res) {
  try {
    const { prompt } = await utils.oidcProvider.interactionDetails(req, res)
    if (prompt.name === 'login') {
      const account = await verifyToken(req.body.token)
      const result = {
        login: {
          accountId: `${account.user}@${account.provider}:${account.role}`,
        },
      }
      return await utils.oidcProvider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      })
    }
  } catch (err) {
    log.error(err)
  }

  return res.redirect(`/oidcui/error`)
}

/**
 * OIDC consent
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.confirm = async function (req, res) {
  try {
    const interactionDetails = await utils.oidcProvider.interactionDetails(req, res)
    const {
      prompt: { name, details },
      params,
      session,
    } = interactionDetails
    if (name === 'consent') {
      let { grantId } = interactionDetails
      const grant = grantId
        ? await utils.oidcProvider.Grant.find(grantId)
        : new utils.oidcProvider.Grant({
            accountId: session.accountId,
            clientId: params.client_id,
          })

      if (details.missingOIDCScope) grant.addOIDCScope(details.missingOIDCScope.join(' '))
      if (details.missingOIDCClaims) grant.addOIDCClaims(details.missingOIDCClaims)
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '))
        }
      }

      grantId = await grant.save()

      const consent = {}
      if (!interactionDetails.grantId) {
        // we don't have to pass grantId to consent, we're just modifying existing one
        consent.grantId = grantId
      }

      const result = { consent }
      return await utils.oidcProvider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true,
      })
    }
  } catch (err) {
    log.error(err)
  }

  // FIXME: Send proper error response
  return res.redirect(`/oidcui/error`)
}

/**
 * List OIDC clients (for the account)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getClients = async function (req, res) {
  const client = new Client('null', currentAccount(req))
  const list = await client.list()

  const clients = {}
  for (const c of list) clients[c.id] = { ...c, redirect_uris: JSON.parse(c.redirect_uris) }

  return res.send({ oidc_clients: clients })
}

/**
 * Create OIDC client
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createClient = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.oidc.client.create`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const client = new Client(valid.id, currentAccount(req))
  try {
    await client.create(valid)
  } catch (err) {
    log.warn(err)
  }

  return client ? res.send({ client: await client.read() }) : res.status(500).send()
}

/**
 * Update OIDC client
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateClient = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.oidc.client.update`, {
    id: req.params.id,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const client = new Client(valid.id, currentAccount(req))
  try {
    await client.update(valid)
  } catch (err) {
    log.warn(err)
  }

  return client ? res.send({ client: await client.read() }) : res.status(500).send()
}

/**
 * Remove OIDC client
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.removeClient = async function (req, res) {
  if (!req.params.id)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: `id is required`,
    })

  const client = new Client(req.params.id, currentAccount(req))
  let result
  try {
    result = await client.delete()
    log.todo(result)
  } catch (err) {
    log.warn(err)
  }

  return client ? res.status(204).send() : res.status(500).send()
}
