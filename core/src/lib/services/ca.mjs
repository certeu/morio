import path from 'path'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { cp, readJsonFile, readFile, writeFile, chown, mkdir } from '#shared/fs'
import { attempt } from '#shared/utils'
import { testUrl } from '#shared/network'
import { resolveServiceConfiguration } from '#config'
// Default hooks
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'ca',
  hooks: {
    /*
     * Lifecycle hook to determine the service status
     */
    status: () => {
      return 0 // FIXME: Do proper introspection about service health
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * FIXME:
     * For a true highly-available CA, we need to hook it up to our
     * distributed database. See: https://github.com/smallstep/nosql/issues/64
     * Until then, we can get by with a single CA, so we'll make sure this
     * will only spin up on the loader.
     * When the leader changes, the CA service will 'follow' it.
     * This will cause renewal of existing certs to break, but should
     * not be a problem to generate new ones.
     * Until we hear back from smallstep, thi will have to do.
     */
    wanted: () => utils.isBrokerNode() ? true : false,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: (hookParams) => defaultRecreateServiceHook('ca', hookParams),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('ca', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * We need to bootstrap the CA or it will generate a random root certificate
     * and secret, and even output the secret in the logs.
     * So instead, let's tell it what root certificate/keys/password it should use.
     */
    prestart: async () => {
      /*
       * We'll check if there's a default ca-cli config file on disk
       * If so, the CA has already been initialized
       */
      const bootstrapped = await readJsonFile('/etc/morio/ca/defaults.json')

      /*
       * If the CA is initialized, we reload the configuration and return
       */
      if (bootstrapped && bootstrapped.fingerprint) {
        await reloadCaConfiguration()
        return true
      }

      /*
       * No config found, generate local configuration
       */
      await generateLocalCaConfig()

      return true
    },
    /**
     * Lifecycle hook for anything to be done right after starting the container
     *
     * We need to make sure the CA is up and running before we continue.
     * If not, provisioning of certificates will fail.
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    poststart: async () => {
      /*
       * Make sure CA is up
       */
      return await attempt({
        every: 5,
        timeout: 60,
        run: async () => await isCaUp(),
        onFailedAttempt: (s) =>
          log.debug(`Waited ${s} seconds for CA, will continue waiting.`),
      })
      if (up) log.debug(`CA is up.`)
      else log.warn(`CA did not come up before timeout. Moving on anyway.`)

      return up
    },
    /**
     * Lifecycle hook that always runs when core reloads the configuration
     */
    reload: async () => reloadCaConfiguration(),
  },
}

/**
 * Helper method to check whether the CA is up
 *
 * @return {bool} result - True if the CA is up, false if not
 */
export const isCaUp = async () => {
  const result = await testUrl(`https://ca:${utils.getPreset('MORIO_CA_PORT')}/health`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })
  if (result && result.status && result.status === 'ok') return true

  return false
}

/**
 * Helper method to reload the configuration, and update state
 *
 */
const reloadCaConfiguration = async () => {
  /*
   * Load CA configuration from disk
   */
  const caConfig = await readJsonFile('/etc/morio/ca/ca.json')

  if (caConfig === false) {
    /*
     * No config on disk. CA is not initialized yet.
     */
    return true
  }

  /*
   * CA config on disk, continue
   */
  const caDefaults = await readJsonFile('/etc/morio/ca/defaults.json')

  /*
   * Extract the JWK from the configuration
   */
  const jwk = caConfig.authority.provisioners
    .filter((provisioner) => provisioner.type.toLowerCase() === 'jwk')
    .pop().key

  /*
   * Load the root & intermediate certficate
   */
  const certificate = await readFile('/etc/morio/shared/root_ca.crt')
  const intermediate = await readFile('/etc/morio/shared/intermediate_ca.crt')

  /*
   * Save fingerprint, JWK, and root certificate in memory for easy access
   */
  utils.setCaConfig({
    url: `https://ca_${utils.getNodeSerial()}:${utils.getPreset('MORIO_CA_PORT')}`,
    fingerprint: caDefaults.fingerprint,
    jwk,
    certificate,
    intermediate,
  })

  return true
}

export const generateCaConfig = async () => {
  /*
   * Let people know this will take a while
   */
  log.debug('Generating inital CA config - This will take a couple of seconds')

  /*
   * Generate keys and certificates
   */
  const init = await generateCaRoot(
    utils.getSettings('cluster.broker_nodes'),
    utils.getSettings('cluster.name')
  )

  /*
   * Generate JWK
   */
  const jwk = await keypairAsJwk(utils.getKeys())

  /*
   * Also store root, intermediate, and fingerprint in keys
   * so it gets distributed accros the cluster (broker) nodes
   */
  utils.setKeys({
    ...utils.getKeys(),
    jwk,
    rfpr: init.root.fingerprint,
    rcrt: init.root.certificate,
    rkey: init.root.keys.private,
    rpwd: init.password,
    icrt: init.intermediate.certificate,
    ikey: init.intermediate.keys.private,
  })

  /*
   * Save root certificate and fingerprint in memory
   */
  const caConfig = {
    url: `https://ca_${utils.getNodeSerial()}:${utils.getPreset('MORIO_CA_PORT')}`,
    fingerprint: init.root.fingerprint,
    jwk,
    certificate: init.root.certificate,
    intermediate: init.intermediate.certificate,
  }
  utils.setCaConfig(caConfig)

  /*
   * Generate local portion of the config
   */
  await generateLocalCaConfig()
}

export const generateLocalCaConfig = async () => {
  /*
   * Save root certificate and fingerprint in memory
   */
  const keys = utils.getKeys()
  utils.setCaConfig({
    url: `https://ca_${utils.getNodeSerial()}:${utils.getPreset('MORIO_CA_PORT')}`,
    fingerprint: keys.rfpr,
    jwk: keys.jwk,
    certificate: keys.rcrt,
    intermediate: keys.icrt,
  })

  /*
   * Also write root & intermediate certificates to the downloads folder
   */
  await mkdir('/morio/data/downloads/certs/')
  await writeFile('/morio/data/downloads/certs/root.pem', keys.rcrt)
  await writeFile('/morio/data/downloads/certs/intermediate.pem', keys.icrt)

  /*
   * Construct step-ca (server) configuration
   */
  const caConfig = resolveServiceConfiguration('ca', { utils })
  const stepServerConfig = {
    ...caConfig.server, // FIXME: What is stored in the server key, if anything?
    root: '/home/step/certs/root_ca.crt',
    crt: '/home/step/certs/intermediate_ca.crt',
    key: '/home/step/secrets/intermediate_ca.key',
    // Adding FQDNs to the CA prohibits it from responding to ACME requests
    // from Traefik as those use the same FQDNs
    //dnsNames: [ ...caConfig.server.dnsNames, ...utils.getCentralFqdns() ],
  }

  /*
   * Add key to jwk provisioner config
   */
  stepServerConfig.authority.provisioners[0].key = keys.jwk

  /*
   * Construct step (client) configuration
   */
  const stepClientConfig = { ...caConfig.client, fingerprint: keys.rfpr }

  /*
   * Create data folder & subfolders and change ownership to user running CA container (UID 1000)
   */
  const uid = utils.getPreset('MORIO_CA_UID')
  await mkdir('/morio/data/ca')
  await chown('/morio/data/ca', uid, uid)
  await mkdir('/etc/morio/ca')
  await chown('/etc/morio/ca', uid, uid)
  for (const sub of ['secrets', 'certs', 'keys', 'db']) {
    await mkdir(`/morio/data/ca/${sub}`)
    await chown(`/morio/data/ca/${sub}`, uid, uid)
  }

  /*
   * Write certificates, keys, and configuration to disk, and let CA own them
   */
  for (const [target, content] of [
    ['/morio/data/ca/certs/root_ca.crt', keys.rcrt],
    ['/morio/data/ca/certs/intermediate_ca.crt', keys.icrt],
    ['/morio/data/ca/secrets/root_ca.key', keys.rkey],
    ['/morio/data/ca/secrets/intermediate_ca.key', keys.ikey],
    ['/morio/data/ca/secrets/password', keys.rpwd],
    ['/etc/morio/ca/ca.json', JSON.stringify(stepServerConfig, null, 2)],
    ['/etc/morio/ca/defaults.json', JSON.stringify(stepClientConfig, null, 2)],
  ]) {
    // Chown the folder prior to writing, because it's typically volume-mapped
    await chown(path.dirname(target), uid, uid)
    await writeFile(target, content)
    await chown(target, uid, uid)
  }

  /*
   * Copy the CA root & intermediate certificates to a shared config folder
   * from where other containers will load it
   */
  await cp(`/morio/data/ca/certs/root_ca.crt`, `/etc/morio/shared/root_ca.crt`)
  await cp(`/morio/data/ca/certs/intermediate_ca.crt`, `/etc/morio/shared/intermediate_ca.crt`)
}


