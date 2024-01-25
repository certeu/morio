import path from 'path'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { cp, readJsonFile, readFile, writeFile, chown, mkdir } from '#shared/fs'

/*
 * We need to bootstrap the CA or it will generate a random root certificate
 * and secret, and even output the secret in the logs.
 * So instead, let's tell it what root certificate/keys/password it should use.
 */
export const bootstrap = async (tools) => {
  /*
   * We'll check if there's a default ca-cli config file on disk
   * If so, the CA has already been initialized
   */
  const bootstrapped = await readJsonFile('/etc/morio/ca/defaults.json')

  /*
   * If the CA is initialized, load JWK key and return early
   */
  if (bootstrapped && bootstrapped.fingerprint) {
    const caConfig = await readJsonFile('/etc/morio/ca/ca.json')
    const jwk = caConfig.authority.provisioners
      .filter((provisioner) => provisioner.type.toLowerCase() === 'jwk')
      .pop().key

    /*
     * Store fingerprint & JWK for easy access
     */
    tools.ca = {
      url: `https://ca_${tools.config.core.node_nr}:9000`,
      fingerprint: bootstrapped.fingerprint,
      jwk,
    }

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
   * Generate JWK
   */
  const jwk = await keypairAsJwk(tools.config.deployment.key_pair)

  /*
   * Store root certificate and fingerprint in tools
   */
  tools.ca = {
    url: `https://ca_${tools.config.core.node_nr}:9000`,
    fingerprint: init.root.fingerprint,
    jwk,
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
  stepServerConfig.authority.provisioners[0].key = jwk

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
