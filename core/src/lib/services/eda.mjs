import { ensureServiceCertificate } from '#lib/tls'
import { utils, log } from '../utils.mjs'
import { cp, chown, mkdir, readFile, writeFile } from '#shared/fs'
// Default hooks
import { defaultRestartServiceHook, defaultRecreateServiceHook } from './index.mjs'

/**
 * Service object holds the various lifecycle methods
 * Note that the EdA service supports running as a multi-istance
 * service, so we need to handle that in the various hooks.
 * That makes this a bit more complex.
 */
export const service = {
  name: 'eda',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      // If the feature flag is not set, this is easy
      if (!utils.getFlag('ENABLE_SERVICE_EDA', false)) return true

      // FIXME
      return true
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * The EDA service needs to be enabled with a feature flag
     * but it also supports a multi-instance setup where we have
     * multiple EDA services on a single node, so this takes a
     * instanceName attributes in the hookParams to tell us what's up
     */
    wanted: ({ instanceName = false }) => {
      // Short-circuit when possible
      if (utils.isEphemeral()) return false
      if (!utils.getFlag('ENABLE_SERVICE_EDA', false)) return false
      if (!instanceName) {
        /*
         * We need a regular EdA service (no multi-instance), but where do we run it?
         * Do we have a specific eda node in the settings?
         */
        const edaNodes = utils.getSettings('flanking_services.eda.nodes', [])
        if (edaNodes.includes(utils.getNodeFqdn())) return true
        /*
         * If there are explicit nodes, we are not part of them.
         * So do not run this service.
         */
        if (edaNodes.length > 0) return false
        /*
         * No explicit EdA node configured.
         * We will run it on all flanking nodes, or all broker nodes.
         */
        if (utils.getFlankingCount() > 0) {
          if (utils.isFlankingNode()) return true
        } else return true

        return false
      } else {
        /*
         * We need a multi-instance EdA
         * The hookParams will hold instanceName
         * We also need to make sure it's a local instance
         */
        const localInstances = utils.getLocalServiceInstances('eda')
        if (localInstances.includes(instanceName)) return true
        else return false
      }
    },
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     */
    precreate: ensureLocalPrerequisites,
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async (hookParams) =>
      await ensureServiceCertificate(
        utils.instanceServiceName('eda', hookParams.instanceName),
        true
      ),
    /*
     * Lifecycle hook to determine whether to recreate the service
     * We just reuse the default hook here, telling it we need TLS configured.
     */
    recreate: (hookParams) => {
      ensureLocalPrerequisites(hookParams)
      return defaultRecreateServiceHook('eda', hookParams)
    },
    /**
     * Lifecycle hook to determine whether to restart the service
     * We just reuse the default hook here, checking whether the service
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('eda', hookParams),
  },
}

async function ensureLocalPrerequisites({ instanceName = false }) {
  const instanceSuffix = instanceName ? `-${instanceName}` : ''

  try {
    // Create config folder
    await mkdir(`/etc/morio/eda${instanceSuffix}`)
    await chown(`/etc/morio/eda${instanceSuffix}`, 1000, 1000)

    // Create data folder
    await mkdir(`/morio/data/eda${instanceSuffix}/morio`)
    await chown(`/morio/data/eda${instanceSuffix}`, 1000, 1000)

    // Copy custom modules
    for (const mod of utils.getPreset('MORIO_EDA_CORE_MODULES')) {
      const target = `/morio/data/eda${instanceSuffix}/morio/${mod}`
      await mkdir(target)
      await chown(target, 1000, 1000)
      await cp(`lib/eda/${mod}`, target, { dereference: true, force: true, recursive: true })
    }

    /* Write Node-RED settings file
     * We need to inject a storage plugin here to ensure Node-RED
     * uses the rqlite database as storage backend so we can scale
     * the EDA service horizontally.
     *
     * We also need to add any NodeJS modules that are part of the
     * global context in Node-RED.
     *
     * Node-RED uses CommonJS with on inline require call so this
     * needs some work to assemble a config file that works as intended.
     */
    const base = {
      ...utils.getMorioServiceConfig('eda', instanceName).eda,
      storageModule: '__REQUIRE_STORAGE_MODULE__',
      functionGlobalContext: {},
    }
    for (const mod of utils.getPreset('MORIO_EDA_GLOBAL_CONTEXT_MODULES') || []) {
      base.functionGlobalContext[mod] = `__REQUIRE_CONTEXT_MODULE_${mod}__`
    }
    let edaSettings =
      '' +
      '// Node-RED settings auto-generated by Morio\n' +
      'module.exports = ' +
      JSON.stringify(base, null, 2)

    edaSettings = edaSettings.replace(
      `"__REQUIRE_STORAGE_MODULE__"`,
      `require("/data/morio/node-red-storage-rqlite/index.js")(),`
    )
    for (const mod of utils.getPreset('MORIO_EDA_GLOBAL_CONTEXT_MODULES') || []) {
      edaSettings = edaSettings.replace(`"__REQUIRE_CONTEXT_MODULE_${mod}__"`, `require("${mod}")`)
    }
    // Node-RED looks for `/data/settings.js`
    await writeFile(`/morio/data/eda${instanceSuffix}/settings.js`, edaSettings, log, 0o640)
    // Prevent read access
    await chown(`/morio/data/eda${instanceSuffix}/settings.js`, 1000, 1000)

    // Ensure service certificate exists
    await ensureServiceCertificate(utils.instanceServiceName('eda', instanceName), true)

    /*
     * Construct Morio plugin settings
     *
     * If this is a broker node, the database service is available locally.
     * But if not, we need a cross-cluser connection, also fetch a JWT for access.
     * Our custom storage plugin handles all of this. The only thing we need to do
     * is tell it what kind of a node we are on, it's FQDN and the cluster FQDN.
     */
    const settings = {
      api: `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}`,
      broker: {
        brokers: utils
          .getBrokerFqdns()
          .map((broker) => `${broker}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`),
        clientId: `morio-eda${instanceSuffix}`,
        logLevel: 'info',
        ssl: {
          rejectUnauthorized: false,
          ca: [utils.getCaTrustChain()],
          cert: await readFile(`/etc/morio/eda${instanceSuffix}/tls-cert.pem`),
          key: await readFile(`/etc/morio/eda${instanceSuffix}/tls-key.pem`),
        },
      },
      db: {
        local: `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db.internal:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
        ccdb: `https://${utils.getLeaderFqdn() || utils.getCentralFqdns()[0]}:${utils.getPreset('MORIO_DB_PROXY_PORT')}`,
        connection: utils.isBrokerNode() ? 'local' : 'ccdb',
        tablePrefix: `${utils.getPreset('MORIO_EDA_TABLE_PREFIX')}${instanceSuffix}`,
      },
    }

    /*
     * Write Morio plugin settings file
     * We need to inject a storage plugin here to ensure Node-RED
     * uses the rqlite database as storage backend so we can scale
     * the EDA service horizontally.
     */
    await writeFile(
      `/etc/morio/eda${instanceSuffix}/morio-settings.js`,
      [
        `// These settings are auto-generated by Morio`,
        `module.exports = ${JSON.stringify(settings, null, 2)}`,
      ].join('\n'),
      log,
      0o640
    )
    // Prevent read access
    await chown(`/etc/morio/eda${instanceSuffix}/morio-settings.js`, 1000, 1000)

    /**
     * We update the entrypoint shell script with our own one.
     * This will be volume-mapped, so we need to write it to disk so it's available
     * when the container is created.
     * Our custom entrypoint will install the local storage module and the module
     * that provides morio integration
     */
    let file = `/morio/data/eda${instanceSuffix}/entrypoint.sh`
    const entrypoint = await readFile(file)
    if (entrypoint && entrypoint.includes('Morio')) {
      log.debug('EdA: Custom entrypoint exists, no action needed')
    } else {
      log.debug('EdA: Creating custom entrypoint')
      await writeFile(file, utils.getMorioServiceConfig('eda', instanceName).entrypoint, log, 0o755)
    }
  } catch (err) {
    log.error(err, `Failed to write entrypoint.sh for the eda${instanceSuffix} service`)
    return false
  }

  return true
}
