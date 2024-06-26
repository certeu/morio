import path from 'path'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { cp, readJsonFile, readFile, writeFile, chown, mkdir } from '#shared/fs'
import { attempt } from '#shared/utils'
import { testUrl } from '#shared/network'
// Default hooks
import {
  defaultWantedHook,
  defaultRecreateContainerHook,
  defaultRestartContainerHook,
} from './index.mjs'
// Store
import { store } from '../store.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'ca',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: defaultWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreateContainer: (hookProps) => defaultRecreateContainerHook('ca', hookProps),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: (hookProps) => defaultRestartContainerHook('ca', hookProps),
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * We need to bootstrap the CA or it will generate a random root certificate
     * and secret, and even output the secret in the logs.
     * So instead, let's tell it what root certificate/keys/password it should use.
     */
    preStart: async () => {
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
       * No config found, generate configuration, keys, certs, and secrets file
       */
      store.log.debug('Generating inital CA config - This will take a couple of seconds')

      /*
       * Generate keys and certificates
       */
      const init = await generateCaRoot(
        store.config.deployment.nodes,
        store.config.deployment.display_name
      )

      /*
       * Generate JWK
       */
      const jwk = await keypairAsJwk(store.keys)

      /*
       * Store root certificate and fingerprint in store
       */
      store.ca = {
        url: `https://ca_${store.config.core.node_nr}:9000`,
        fingerprint: init.root.fingerprint,
        jwk,
        certificate: init.root.certificate,
        intermediate: init.intermediate.certificate,
      }

      /*
       * Also write root & intermediate certificates to the downloads folder
       */
      await mkdir('/morio/data/downloads/certs/')
      await writeFile('/morio/data/downloads/certs/root.pem', init.root.certificate)
      await writeFile('/morio/data/downloads/certs/intermediate.pem', init.intermediate.certificate)

      /*
       * Construct step-ca (server) configuration
       */
      const stepServerConfig = {
        ...store.config.services.ca.server,
        root: '/home/step/certs/root_ca.crt',
        crt: '/home/step/certs/intermediate_ca.crt',
        key: '/home/step/secrets/intermediate_ca.key',
        dnsNames: [...store.config.services.ca.server.dnsNames, ...store.config.deployment.nodes],
      }

      /*
       * Add key to jwk provisioner config
       */
      stepServerConfig.authority.provisioners[0].key = jwk

      /*
       * Construct step (client) configuration
       */
      const stepClientConfig = {
        ...store.config.services.ca.client,
        fingerprint: init.root.fingerprint,
      }

      /*
       * Create data folder & subfolders and change ownership to user running CA container (UID 1000)
       */
      const uid = store.getPreset('MORIO_CA_UID')
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
        ['/morio/data/ca/certs/root_ca.crt', init.root.certificate],
        ['/morio/data/ca/certs/intermediate_ca.crt', init.intermediate.certificate],
        ['/morio/data/ca/secrets/root_ca.key', init.root.keys.private],
        ['/morio/data/ca/secrets/intermediate_ca.key', init.intermediate.keys.private],
        ['/morio/data/ca/secrets/password', init.password],
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
    postStart: async () => {
      /*
       * Make sure CA is up
       */
      const up = await attempt({
        every: 2,
        timeout: 60,
        run: async () => await isCaUp(),
        onFailedAttempt: (s) =>
          store.log.debug(`Waited ${s} seconds for CA, will continue waiting.`),
      })
      if (up) store.log.debug(`CA is up.`)
      else store.log.warn(`CA did not come up before timeout. Moving on anyway.`)

      return true
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
  const result = await testUrl(`https://ca_${store.config.core.node_nr}:9000/health`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })
  if (result && result.status && result.status === 'ok') return true

  return false
}

/**
 * Helper method to reload the configuration, and populate store
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
   * Store fingerprint, JWK, and root certificate in the store for easy access
   */
  store.ca = {
    url: `https://ca_${store.config.core.node_nr}:9000`,
    fingerprint: caDefaults.fingerprint,
    jwk,
    certificate,
    intermediate,
  }

  return true
}
