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
}

export const resolveServiceConfiguration = (name, helpers) =>
  resolvers[name] ? resolvers[name](helpers) : false

/*
 * This is the order in which services are started
 */
export const serviceOrder = [
  'db',
  'ca',
  'proxy',
  'api',
  'ui',
  'broker',
  'console',
  'connector',
  'dbuilder',
]

/*
 * This is the order in which services are started in ephemeral mode
 */
export const ephemeralServiceOrder = [
  'proxy',
  'api',
  'ui',
]

/*
 * This defined which services will never be created as swarm
 * services, but instead run as a local container.
 */
export const neverSwarmServices = [
  'broker',
  'console',
  'proxy',
]

/**
 * Helper method to generate the lables to configure Traefik
 *
 * This will be hard to understand without knowing the syntax
 * of Traefik label-based configuration. So see:
 * https://doc.traefik.io/traefik/providers/docker/#routing-configuration-with-labels
 *
 * @param {object} utils - The utils object
 * @param {object} params - The other parameters
 * @param {string} params.name - The name of the service
 * @param {array} params.prefixes - An optional array of prefixes to match when routing requests to the service
 * @param {number} priority - The priority when matching the rules to incoming requests
 * @return {array} labels - An array of labels for the container/service
 */
export const generateTraefikLabels = (utils, {
  service,
  prefixes=[],
  paths=[],
  priority=666,
  backendTls=false,
}) => {
  const port = getServicePort(service, utils)
  const nodes = utils.getAllFqdns()
  const clusterFqdn = utils.getSettings('deployment.fqdn', false)
  const labels = [
    `traefik.enable=true`,
    `traefik.docker.network=${utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK')}`,
    `traefik.http.routers.${service}.priority=${priority}`,
    `traefik.http.routers.${service}.service=${service}`,
    `traefik.http.routers.${service}.entrypoints=https`,
    `traefik.http.routers.${service}.tls.certresolver=ca`,
    `traefik.http.services.${service}.loadbalancer.server.port=${port}`,
    `traefik.tls.stores.default.defaultgeneratedcert.resolver=ca`,
    `traefik.http.routers.${service}.tls=true`,
    `traefik.tls.stores.default.defaultgeneratedcert.domain.main=${clusterFqdn
      ? clusterFqdn
      : utils.getSettings(['deployment', 'nodes', 0])}`,
    `traefik.tls.stores.default.defaultgeneratedcert.domain.sans=${nodes.join(', ')}`,
  ]
  if (backendTls) labels.push(`traefik.http.services.${service}.loadbalancer.server.scheme=https`)
  const hostRule = traefikHostRulePrefix(service, nodes)
  if (prefixes.length > 0) labels.push(`${hostRule} && (${prefixes.map(p => "PathPrefix(`"+p+"`)").join(' || ')})`)
  if (paths.length > 0) labels.push(`${hostRule} && (${paths.map(p => "Path(`"+p+"`)").join(' || ')})`)

  return labels
}

/**
 * Helper method to construct the 'Host' part of a traefik rule
 *
 * @param {string} router - The router name, typically the service name
 * @param {array} nodes - The nodes to include in the rule
 * @param {string} rule - The (part of a) Traefik rule matching the nodes on the router
 */
export const traefikHostRulePrefix = (router, nodes) => `traefik.http.routers.${router}.rule=(${nodes.map(n => "Host(`"+n+"`)").join(' || ')})`

const getServicePort = (service, utils) => {
  if (service === 'api') return utils.getPreset('MORIO_API_PORT')
  if (service === 'core') return utils.getPreset('MORIO_CORE_PORT')
  if (service === 'ui') return utils.getPreset('MORIO_UI_PORT')
  if (service === 'ca') return 9000
  if (service === 'db') return 4001
}
