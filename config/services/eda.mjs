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
   * Grab directories here to keep this DRY
   */
  const DIRS = {
    conf: utils.getPreset('MORIO_CONFIG_ROOT'),
    data: utils.getPreset('MORIO_DATA_ROOT'),
  }

  /*
   * Traefik (proxy) configuration for the EDA service
   */
  const traefik = {
    eda: generateTraefikConfig(utils, {
      service: 'eda',
      prefixes: [`/${utils.getPreset('MORIO_EDA_PREFIX')}`],
      priority: 666,
    })
      /*
       * Middleware to add Morio service header
       */
      .set(
        'http.middlewares.eda-service-header.headers.customRequestHeaders.X-Morio-Service',
        'eda'
      )
      /*
       * Middleware for central authentication/access control
       */
      .set(
        'http.middlewares.eda-auth.forwardAuth.address',
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}/auth`
      )
      .set('http.middlewares.eda-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      /*
       * Add middleware to router
       * The order in which middleware is loaded matters. Prefix shoud go first, auth last.
       */
      .set('http.routers.eda.middlewares', [
        'eda-service-header@file',
        'eda-auth@file',
      ])
  }

  return {
    /**
     * Container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'eda',
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
        `${DIRS.conf}/eda:/etc/morio/eda`,
        `${DIRS.data}/eda:/data`,
        `${DIRS.data}/eda/entrypoint.sh:/usr/src/node-red/entrypoint.sh`,
      ],
      // Environment
      environment: {
        MORIO_FQDN: process.env['MORIO_FQDN'],
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
      tablePrefix: 'nodered_'
    },
    /*
     * Node-Red settings
     * The custom storage module will be added to this by core
     */
    eda: {
      /*
       * Set prefix for UI access. Node-RED makes this easy.
       */
      httpAdminRoot: '/eda',
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
      uiPort: utils.getFlag('MORIO_EDA_HTTP_PORT') || 1880,
      /*
       * Prefix for nodes that accept incoming HTTP
       */
      httpNodeRoot: '/eda/webhooks',
      /*
       * Permissive CORS
       */
      httpNodeCors: {
          erigin: "*",
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
          title: "Morio EdA",
          favicon: "/favicon.svg",
          css: "",
          scripts: [],
        },
        header: {
          title: "Morio EdA",
          image: null,
          url: "/eda/",
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
