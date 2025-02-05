import { writeJsonFile, chown, mkdir } from '#shared/fs'
import { ensureServiceCertificate } from '#lib/tls'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

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
      const sinks = utils.getSettings('connector.sinks', false)

      // Without sinks, this service should not be started
      if (sinks === false || Object.values(sinks).filter((sink) => !sink.disabled).length < 1)
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
   * Generate key and certificate for mTLS
   */
  await ensureServiceCertificate('connector', false)

  /*
   * Write out vector.yaml based on the settings
  const config = utils.getMorioServiceConfig('connector', false)
  if (config) {
    const file = '/etc/morio/connector/vector.yaml'
    log.debug('Connector: Creating config file')
    await writeJsonFile(file, {
      ...config.vector,
      sources: utils.getSettings('connector.sources', {}),
      transforms: utils.getSettings('connector.transforms', {}),
      sinks: utils.getSettings('connector.sinks', {}),
    }, log, 0o644)
  }
   */

  /*
   * Make sure the data directory exists, and is writable
   */
  const uid = utils.getPreset('MORIO_CONNECTOR_UID')
  await mkdir('/morio/data/connector')
  await chown('/morio/data/connector', uid, uid)

  return true
}

async function ensurePipelines() {
  /*
   * Load vector.yaml base settings
   */
  const config = utils.getMorioServiceConfig('connector', false)

  /*
   * Populate sources, sinks, and transforms
   */
  const sst = {
    sources: utils.getSettings('connector.sources', {}),
    sinks: utils.getSettings('connector.sinks', {}),
    transforms: utils.getSettings('connector.transforms', {}),
  }
  const local = {
    type: 'kafka',
    bootstrap_servers: utils
      .getBrokerFqdns()
      .map((fqdn) => `${fqdn}:9092`)
      .join(),
    tls: {
      ca_file: '/etc/vector/tls-ca.pem',
      crt_file: '/etc/vector/tls-cert.pem',
      key_file: '/etc/vector/tls-key.pem',
      enabled: true,
    },
  }

  /*
   * Process sources
   */
  for (const source in sst.sources) {
    if (sst.sources[source].type === 'local_morio') {
      const add = {
        ...local,
        group_id: `morio_connector_source__${source}`,
      }
      sst.sources[source] = { ...sst.sources[source], ...add }
    }
  }

  /*
   * Process sinks
   */
  for (const sink in sst.sinks) {
    if (sst.sinks[sink].type === 'local_morio') {
      const add = {
        ...local,
        consgroup_id: `morio_connector_sink__${sink}`,
      }
      sst.sinks[sink] = { ...sst.sinks[sink], ...add }
    }
  }

  /*
   * Write out file
   */
  const file = '/etc/morio/connector/vector.json'
  log.debug('Connector: Creating config file')
  await writeJsonFile(file, { ...config.vector, ...sst }, log, 0o644)
}
