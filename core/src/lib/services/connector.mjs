import { writeFile, writeYamlFile, chown, mkdir } from '#shared/fs'
import { convertPkcs1ToPkcs8 } from '#shared/crypto'
import { ensureServiceCertificate } from '#lib/tls'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'
// Logstash
import { ensurePipelines } from '../logstash/index.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'connector',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     *
     * For the connector, the answer is only true when there are pipelines configured
     *
     * @return {boolean} wanted - Wanted or not
     */
    wanted: async () => {
      const pipelines = utils.getSettings('connector.pipelines', false)

      // Without pipelines, this service should not be started
      if (
        pipelines === false ||
        Object.values(pipelines).filter((pipe) => !pipe.disabled).length < 1
      )
        return false
      // Always update pipeline config until we have a way to diff them
      else await ensurePipelines()

      return true
    },
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => defaultRecreateServiceHook('connector'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('connector', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the logstash.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    precreate: ensureLocalPrerequisites,
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the logstash.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    predefer: ensureLocalPrerequisites,
    prestart: async () => {
      const result = await ensurePipelines()

      return result
    },
  },
}

async function ensureLocalPrerequisites() {
  /*
   * Write out logstash.yml based on the settings
   */
  const config = utils.getMorioServiceConfig('connector', false)
  if (config) {
    const file = '/etc/morio/connector/logstash.yml'
    log.debug('Connector: Creating config file')
    await writeYamlFile(file, config.logstash, log, 0o644)
  }

  /*
   * Make sure the data directory exists, and is writable
   */
  const uid = utils.getPreset('MORIO_CONNECTOR_UID')
  await mkdir('/morio/data/connector')
  await chown('/morio/data/connector', uid, uid)

  /*
   * Make sure the pipelines directory exists, and is writable
   */
  await mkdir('/etc/morio/connector/pipelines')
  await chown('/etc/morio/connector/pipelines', uid, uid)

  /*
   * Make sure the pipeline_assets directory exists, and is writable
   */
  await mkdir('/etc/morio/connector/pipeline_assets')
  await chown('/etc/morio/connector/pipeline_assets', uid, uid)

  /*
   * Make sure pipelines.yml file exists, so it can be mounted
   */
  await writeYamlFile('/etc/morio/connector/pipelines.yml', {}, log, 0o644)

  /*
   * Make sure we have a keystore on disk to connect to Kafka
   */
  const x509 = await ensureServiceCertificate('connector', true)
  const keystore = '/etc/morio/connector/pipeline_assets/local-keystore.pem'
  await writeFile(
    keystore,
    convertPkcs1ToPkcs8(x509.key) + x509.cert + utils.getCaConfig().intermediate,
    log,
    0o600
  )
  await chown(keystore, uid, uid)

  /*
   * Also add a truststore, which is just the CA root PEM
   */
  const truststore = '/etc/morio/connector/pipeline_assets/local-truststore.pem'
  await writeFile(truststore, utils.getCaConfig().certificate, log, 0o644)

  return true
}
