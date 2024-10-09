import { YamlConfig } from '../yaml-config.mjs'
import { resolveServiceConfiguration as api } from './api.mjs'
import { resolveServiceConfiguration as broker } from './broker.mjs'
import { resolveServiceConfiguration as ca } from './ca.mjs'
import { resolveServiceConfiguration as console } from './console.mjs'
import { resolveServiceConfiguration as connector } from './connector.mjs'
import { resolveServiceConfiguration as core } from './core.mjs'
import { resolveServiceConfiguration as db } from './db.mjs'
import { resolveServiceConfiguration as dbuilder } from './dbuilder.mjs'
import { resolveServiceConfiguration as proxy } from './proxy.mjs'
import { resolveServiceConfiguration as ui } from './ui.mjs'
import { resolveServiceConfiguration as watcher } from './watcher.mjs'
import { resolveServiceConfiguration as web } from './web.mjs'

const resolvers = {
  api,
  broker,
  ca,
  console,
  connector,
  core,
  db,
  dbuilder,
  proxy,
  ui,
  watcher,
  web,
}

export const resolveServiceConfiguration = (name, helpers) =>
  resolvers[name] ? resolvers[name](helpers) : false

/*
 * This is the order in which services are started
 */
export const serviceOrder = [
  'api',
  'ca',
  'broker',
  'db',
  'console',
  'ui',
  'proxy',
  'connector',
  'watcher',
  'web',
  'dbuilder',
]

/*
 * This is the order in which services are started in ephemeral mode
 */
export const ephemeralServiceOrder = ['proxy', 'api', 'ui']

/*
 * List of services that we should not take for granted
 */
export const optionalServices = ['db', 'ui', 'connector', 'dbuilder', 'watcher']

/**
 * Helper method to generate the Traefik configuration
 *
 * @param {object} utils - The utils object
 * @param {object} params - The other parameters
 * @param {string} params.name - The name of the service
 * @param {array} params.prefixes - An optional array of prefixes to match when routing requests to the service
 * @param {number} priority - The priority when matching the rules to incoming requests
 * @return {array} labels - An array of labels for the container/service
 */
export const generateTraefikConfig = (
  utils,
  { service, prefixes = [], paths = [], priority = 666, backendTls = false }
) => {
  const port = getServicePort(service, utils)
  // Paths to save us from typing them too often
  const ROUTER = ['http', 'routers', service]
  const RULE = [...ROUTER, 'rule']
  const SERVICE = ['http', 'services', service]
  /*
   * Initial configuration object (tc = Traefik config)
   */
  const tc = new YamlConfig()
    .set(ROUTER, {
      priority,
      service,
      entrypoints: 'https',
      tls: true,
    })
    .set(SERVICE, {
      loadBalancer: {
        servers: [{ url: `${backendTls ? 'https' : 'http'}://${service}:${port}` }],
      },
    })
  if (utils.isEphemeral()) {
    if (paths.length > 0) tc.set(RULE, `( ${paths.map((p) => 'Path(`' + p + '`)').join(' || ')} )`)
    else if (prefixes.length > 0)
      tc.set(RULE, `( ${prefixes.map((p) => 'PathPrefix(`' + p + '`)').join(' || ')} )`)
  } else {
    // Set certificate resolver
    tc.set([...ROUTER, 'tls', 'certresolver'], 'ca')
    // Include rules and config using the cluster's FQDNs/nodes
    tc.set([...ROUTER, 'tls'], true)
    if (paths.length > 0) tc.set(RULE, `( ${paths.map((p) => 'Path(`' + p + '`)').join(' || ')} )`)
    else if (prefixes.length > 0)
      tc.set(RULE, `( ${prefixes.map((p) => 'PathPrefix(`' + p + '`)').join(' || ')} )`)
  }

  return tc
}

/**
 * Helper method to construct the 'Host' part of a traefik rule
 *
 * @param {string} router - The router name, typically the service name
 * @param {array} nodes - The nodes to include in the rule
 * @param {string} rule - The (part of a) Traefik rule matching the nodes on the router
 */
export const traefikHostRulePrefix = (router, nodes) =>
  `traefik.http.routers.${router}.rule=(${nodes.map((n) => 'Host(`' + n + '`)').join(' || ')})`

const getServicePort = (service, utils) => {
  if (service === 'api') return utils.getPreset('MORIO_API_PORT')
  if (service === 'core' || service === 'coredocs') return utils.getPreset('MORIO_CORE_PORT')
  if (service === 'ui') return utils.getPreset('MORIO_UI_PORT')
  if (service === 'ca') return utils.getPreset('MORIO_CA_PORT')
  if (service === 'db') return utils.getPreset('MORIO_DB_HTTP_PORT')
  if (service === 'console') return utils.getPreset('MORIO_CONSOLE_PORT')
  if (service === 'rpadmin') return utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')
  if (service === 'rpproxy') return utils.getPreset('MORIO_BROKER_REST_API_PORT')
  if (service === 'watcher') return utils.getPreset('MORIO_WATCHER_HTTP_PORT')
  if (service === 'web') return utils.getPreset('MORIO_WEB_HTTP_PORT')
}
