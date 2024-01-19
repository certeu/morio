import path from 'path'
import { pkg } from '#shared/pkg'
import { logger } from '#shared/logger'
import { getPreset, inProduction } from '#config'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { cp, readJsonFile, readFile, writeFile, writeYamlFile, chown, mkdir } from '#shared/fs'
import { startMorio } from './morio.mjs'

/*
 * We need to bootstrap the CA or it will generate a random root certificate
 * and secret, and even output the secret in the logs.
 * So instead, let's tell it what root certificate/keys/password it should use.
 */
const bootstrapCa = async (tools) => {
  /*
   * We'll check if there's a default ca-cli config file on disk
   * If so, the CA has already been initialized
   */
  const bootstrapped = await readJsonFile('/etc/morio/ca/defaults.json')

  /*
   * If the CA is initialized, return early
   */
  if (bootstrapped && bootstrapped.fingerprint) {
    /*
     * Store fingerprint for easy access
     */
    tools.ca = { fingerprint: bootstrapped.fingerprint }

    /*
     * Load the root certficate, then return early
     */
    const root = await readFile('/etc/morio/shared/root_ca.crt')
    tools.ca.certificate = root

    return tools
  }

  /*
   * No config, generate configuration, keys, certs, and secrets file
   */
  tools.log.debug('Generating inital CA config - This will take a couple of seconds')

  /*
   * Generate keys and certificates
   */
  const init = await generateCaRoot(
    tools.config.deployment.nodes,
    tools.config.deployment.display_name
  )

  /*
   * Store root certificate and fingerprint in tools
   */
  tools.ca = {
    fingerprint: init.root.fingerprint,
    certificate: init.root.certificate,
  }

  /*
   * Construct step-ca (server) configuration
   */
  const stepServerConfig = {
    ...tools.config.services.ca.server,
    root: '/home/step/certs/root_ca.crt',
    crt: '/home/step/certs/intermediate_ca.crt',
    key: '/home/step/secrets/intermediate_ca.key',
    dnsNames: [...tools.config.services.ca.server.dnsNames, ...tools.config.deployment.nodes],
  }
  /*
   * Add key to jwk provisioner config
   */
  tools.log.debug(tools.config)
  stepServerConfig.authority.provisioners[0].key = await keypairAsJwk(
    tools.config.deployment.key_pair
  )

  /*
   * Construct step (client) configuration
   */
  const stepClientConfig = {
    ...tools.config.services.ca.client,
    fingerprint: init.root.fingerprint,
  }

  /*
   * Create data folder and change ownership to user running CA container (UID 1000)
   */
  await mkdir('/morio/data/ca')
  await chown('/morio/data/ca', 1000, 1000)

  /*
   * Write certificates, keys, and configuration to disk, and let CA own them
   */
  for (const [target, content] of [
    ['/morio/data/ca/certs/root_ca.crt', init.root.certificate],
    ['/morio/data/ca/certs/intermediate_ca.crt', init.intermediate.certificate],
    ['/morio/data/ca/secrets/root_ca.key', init.root.keys.private],
    ['/morio/data/ca/secrets/intermediate_ca.key', init.intermediate.keys.private],
    ['/morio/data/ca/secrets/password', init.password],
    ['/etc/morio/ca/ca.json', JSON.stringify(stepServerConfig, null, 2)],
    ['/etc/morio/ca/defaults.json', JSON.stringify(stepClientConfig, null, 2)],
  ]) {
    // Chown the folder prior to writing, because it's typically volume-mapped
    await chown(path.dirname(target), 1000, 1000, tools.log)
    await writeFile(target, content, tools.log)
    await chown(target, 1000, 1000, tools.log)
  }

  /*
   * Copy the CA root certificate to a shared config folder
   * from where other containers will load it
   */
  await cp(`/morio/data/ca/certs/root_ca.crt`, `/etc/morio/shared/root_ca.crt`)
}

/*
 * Bootstrap RedPanda Console
 */
const bootstrapConsole = async (tools) => {
  /*
   * We'll check if there's a config file on disk
   * If so, the console has already been initialized
   */
  const bootstrapped = await readJsonFile('/etc/morio/console/config.yaml')

  /*
   * If the Console is initialized, return early
   */
  if (bootstrapped && bootstrapped.redpanda) {
    tools.log.debug('Console already initialized')
    return
  }

  /*
   * Load configration base
   */
  const base = { ...tools.config.services.console.console }
  /*
   * Populate Kafka nodes, schema URLs, and RedPanda URLs
   */
  base.kafka.brokers = tools.config.deployment.nodes.map((n, i) => `broker_${i + 1}:9092`)
  base.kafka.schemaRegistry.urls = tools.config.deployment.nodes.map(
    (n, i) => `http://broker_${i + 1}:8081`
  )
  base.redpanda.adminApi.urls = tools.config.deployment.nodes.map(
    (n, i) => `http://broker_${i + 1}:9644`
  )
  /*
   * Write configuration file
   */
  await writeYamlFile(`/etc/morio/console/config.yaml`, base)
}

/*
 * This runs only when core is cold-started.
 * It is exported because it's loaded at startup from index.mjs
 */
export const bootstrapCore = async () => {
  /*
   * First setup the tools object with the logger, so we can log
   */
  const tools = {
    log: logger(getPreset('MORIO_CORE_LOG_LEVEL'), pkg.name),
    // Add some info while we're at it
    info: {
      about: pkg.description,
      name: pkg.name,
      production: inProduction(),
      start_time: Date.now(),
      version: pkg.version,
    },
    inProduction,
  }

  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  tools.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    tools.log.debug(`Preset ${key} = ${result}`)

    return result
  }

  /*
   * Now start Morio
   */
  await startMorio(tools)

  /*
   * Finally, return the tools object
   */
  return tools
}

/*
 * Named export of a Plain object
 * with bootstrap methods for those services that require them
 */
export const bootstrap = {
  ca: bootstrapCa,
  console: bootstrapConsole,
  core: bootstrapCore,
}
