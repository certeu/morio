import { generateTraefikConfig } from './index.mjs'
import process from 'process'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'nodered/node-red',
  // Image tag (version) to run
  tag: '4.0.9-22-minimal',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * This service supports running multiple instances
   * in which case the config holds eda.instances
   */
  const instances = utils.getLocalServiceInstances('eda')

  if (!Array.isArray(instances)) return resolveServiceInstanceConfiguration(false, 0, utils)
  else if (instances.length > 0) {
    const multi = { multiInstance: true, instances: {} }
    let i = 0
    for (const instance of instances) {
      multi.instances[instance] = resolveServiceInstanceConfiguration(instance, i, utils)
      i++
    }

    return multi
  }
  else return false
}


export const resolveServiceInstanceConfiguration = (instance, instanceIndex, utils) => {
  /*
   * Grab directories here to keep this DRY
   */
  const DIRS = {
    conf: utils.getPreset('MORIO_CONFIG_ROOT'),
    data: utils.getPreset('MORIO_DATA_ROOT'),
  }

  /*
   * Prepare some vars to help us
   */
  const instanceServiceName = utils.instanceServiceName('eda', instance)
  const instanceSuffix = instance ? `-${instance}` : ''
  const instanceTitle = `Morio EdA${instance ? ' ('+instance+')' : ''}`

  /*
   * We need a port per instance
   */
  const customPort = Number(utils.getFlag('MORIO_EDA_HTTP_PORT') || 1880) + instanceIndex

  /*
   * Traefik (proxy) configuration for the EDA service
   */
  const traefik = {}
  traefik[instanceServiceName] = generateTraefikConfig(utils, {
      service: instanceServiceName,
      prefixes: [`/${utils.getPreset('MORIO_EDA_PREFIX')}${instanceSuffix}`],
      priority: 666,
      customPort,
    })
    /*
     * Middleware to add Morio service header
     */
    .set(
      `http.middlewares.eda${instanceSuffix}-service-header.headers.customRequestHeaders.X-Morio-Service`,
      'eda'
    )
    /*
     * Middleware for central authentication/access control
     */
    .set(
      `http.middlewares.eda${instanceSuffix}-auth.forwardAuth.address`,
      `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}/auth`
    )
    .set(`http.middlewares.eda${instanceSuffix}-auth.forwardAuth.authResponseHeadersRegex`, `^X-Morio-`)
    /*
     * Add middleware to router
     * The order in which middleware is loaded matters. Prefix shoud go first, auth last.
     */
    .set(`http.routers.eda${instanceSuffix}.middlewares`, [
      `eda${instanceSuffix}-service-header@file`,
      `eda${instanceSuffix}-auth@file`,
    ])

  const cors = utils.getSettings('eda.cors', false)
  if (cors && Array.isArray(cors.origins) && cors.origins.length > 0) {
    const lead = `http.middlewares.eda${instanceSuffix}-cors-headers.headers`
    traefik[instanceServiceName].set(`${lead}.accessControlAllowMethods`, cors.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    traefik[instanceServiceName].set(`${lead}.accessControlAllowHeaders`, cors.headers || ['*'])
    traefik[instanceServiceName].set(`${lead}.accessControlAllowOriginList`, cors.origins || ['*'])
    traefik[instanceServiceName].set(`${lead}.accessControlMAxAge`, 86400) // Cache preflight for 24 hours
    traefik[instanceServiceName].set(`${lead}.addVaryHeader`, true)
    traefik[instanceServiceName].set(`http.routers.eda${instanceSuffix}.middlewares`, [
      `eda${instanceSuffix}-service-header@file`,
      `eda${instanceSuffix}-cors-headers@file`,
      `eda${instanceSuffix}-auth@file`,
    ])
  }

  return {
    /**
     * Container configuration
     */
    container: {
      // Name to use for the running container
      container_name: `eda${instanceSuffix}`,
      // Image to run
      image: pullConfig.image,
      // Image tag (version) to run
      tag: pullConfig.tag,
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: [
        `${DIRS.conf}/eda${instanceSuffix}:/etc/morio/eda`,
        `${DIRS.data}/eda${instanceSuffix}:/data`,
        `${DIRS.data}/eda${instanceSuffix}/entrypoint.sh:/usr/src/node-red/entrypoint.sh`,
      ],
      // Environment
      environment: {
        MORIO_FQDN: process.env['MORIO_FQDN'],
        NODE_EXTRA_CA_CERTS: '/etc/morio/eda/tls-ca.pem',
      },
      // Add extra hosts
      hosts: [],
    },
    /*
     * Traefik (proxy) configuration for the EDA service
     */
    traefik,
    /*
     * Node-Red storage plugin settings
     */
    storage: {
      rqliteUrl: 'http://morio-db:4001',
      tablePrefix: `nodered_${instance ? instance : ''}`
    },
    /*
     * Node-Red settings
     * The custom storage module will be added to this by core
     * As well as the `require` calls under functionGlobalContext
     */
    eda: {
      /*
       * Set prefix for UI access. Node-RED makes this easy.
       */
      httpAdminRoot: `/eda${instanceSuffix}`,
      /*
       * Extra folder to scan for nodes, outside the container
       */
      nodesDir: '/data/nodes',
      /*
       * Listen on all interfaces
       */
      uiHost: "0.0.0.0",
      /*
       * Port to listen on
       */
      uiPort: customPort,
      /*
       * Prefix for nodes that accept incoming HTTP
       */
      httpNodeRoot: `/eda${instanceSuffix}/webhooks`,
      /*
       * Permissive CORS
       */
      httpNodeCors: {
          origin: "*",
          methods: "GET,PUT,POST,DELETE"
      },
      /*
       * Logging configuration
       */
      logging: {
        console: {
          level: "info",
          metrics: false,
          audit: true
        }
      },
      /*
       * Global modules
       */
      functionGlobalContext: { },
      /*
       * Allow modules
       */
      externalModules: {
        autoInstall: false,
        autoInstallRetry: 30,
        palette: {
          allowInstall: true,
          allowUpdate: true,
          allowUpload: true,
          allowList: ['*'],
          denyList: [],
          allowUpdateList: ['*'],
          denyUpdateList: []
        },
        modules: {
          allowInstall: true,
          allowList: [],
          denyList: []
        }
      },
      /*
       * Key for encrypting credentials
       * This needs to be a random string that is available on all cluster nodes
       * So we use the salt from the Morio root token as that is on disk
       */
      credentialSecret: utils.getKeys().mrt.salt,
      /*
       * Pretty-print flow config
       */
      flowFilePretty: true,
      /*
       * Limit API call body to 5mb
       */
      apiMaxLength: '5mb',
      /*
       * Language
       */
      lang: "en-US",
      /*
       * Diagnostics
       */
      diagnostics: {
        enabled: true,
        ui: true,
      },
      /*
       * Runtime state allow start/stop
       */
      runtimeState: {
        enabled: true,
        ui: true,
      },
      /*
       * FIXME: This is not cluster-ready and should be hooked into rqlite
       */
      contextStorage: {
        default: {
          module:"localfilesystem"
        },
      },
      /*
       * Show global context in the sidebar
       */
      exportGlobalContextKeys: true,
      /*
       * Allow the Function node to load additional npm modules directly
       */
      functionExternalModules: true,
      /*
       * Allow colors in the debug output
       */
      debugUseColors: true,
      /*
       * Maximum debug length
       */
      debugMaxLength: 1000,
      /*
       * Maximum buffer size for the exec node (25MB)
       */
      execMaxBufferSize: 25000000,
      /*
       * Timeout in milliseconds for HTTP request connections (12s)
       */
      httpRequestTimeout: 12000,
      /*
       * Theme settings
       */
      editorTheme: {
        page: {
          title: instanceTitle,
          favicon: "/favicon.svg",
          css: "",
          scripts: [],
        },
        header: {
          title: instanceTitle,
          image: null,
          url: `/eda${instanceSuffix}/`,
        },
        deployButton: {
          type: "simple",
          label: "Save",
          icon: null,
        },
        tours: false,
        palette: {
          categories: ['common', 'function', 'morio', 'network', 'parser', 'sequence', 'storage', 'subflows'],
        },
        projects: {
          enabled: false,
        },
        codeEditor: {
          lib: "monaco",
          options: {
            theme: "vs",
            fontSize: 14,
            fontFamily: "Cascadia Code, Fira Code, Consolas, 'Courier New', monospace",
            fontLigatures: true,
          }
        },
        markdownEditor: {
          mermaid: {
            enabled: true
          }
        },
      },
    },
    entrypoint : `#!/bin/bash

trap stop SIGINT SIGTERM

function stop() {
        kill $CHILD_PID
        wait $CHILD_PID
}

# Custom entrypoint changes for Morio
cd /data
npm install ./morio/node-red-storage-rqlite
npm install ./morio/node-red-morio
cd -

/usr/local/bin/node $NODE_OPTIONS node_modules/node-red/red.js --userDir /data $FLOWS "\${@}" &

CHILD_PID="$!"

wait "\${CHILD_PID}"
`
  }
}
