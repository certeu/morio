import { generateTraefikConfig, getContainerTagSuffix } from './index.mjs'
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
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

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
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}/auth`
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
        `${DIRS.conf}/eda/settings.js:/data/settings.js`,
      ],
      // Run an init inside the container to forward signals and avoid PID 1
      //init: true,
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
     */
    eda: {
      // File containing nodered flows
      flowFile: 'flows.json',

      // Key for encrypting credentials
      credentialSecret: "a-secret-key",

      // Pretty-print flow config
      flowFilePretty: true,

      // Keep data outside container
      userDir: '/data/users/',

      // (extra) dir to scan for nodes
      nodesDir: '/data/nodes',

      // Port to listen on
      uiPort: utils.getFlag('MORIO_EDA_HTTP_PORT') || 1880,

      // Listen on all interfaces
      uiHost: "0.0.0.0",

      // Limit API call body to 5mb
      apiMaxLength: '5mb',

      // Set prefix for UI access
      httpAdminRoot: '/eda',

      // FIXME: Use this for auth?
      // httpAdminMiddleware: function(req,res,next) {
      //    // Set the X-Frame-Options header to limit where the editor
      //    // can be embedded
      //    //res.set('X-Frame-Options', 'sameorigin');
      //    next();
      // },

      /**
       * FIXME: Use this for webhooks?
       * Some nodes, such as HTTP In, can be used to listen for incoming http requests.
        * By default, these are served relative to '/'. The following property
        * can be used to specify a different root path. If set to false, this is
        * disabled.
        */
      //httpNodeRoot: '/red-nodes',

      // Permissive CORS
      httpNodeCors: {
          origin: "*",
          methods: "GET,PUT,POST,DELETE"
      },

      /**
       * // FIXME: Use this for auth?
       * The following property can be used to add a custom middleware function
        * in front of all http in nodes. This allows custom authentication to be
        * applied to all http in nodes, or any other sort of common request processing.
        * It can be a single function or an array of middleware functions.
        */
      //httpNodeMiddleware: function(req,res,next) {
      //    // Handle/reject the request, or pass it on to the http in node by calling next();
      //    // Optionally skip our rawBodyParser by setting this to true;
      //    //req.skipRawBodyParser = true;
      //    next();
      //},


      // Language
      lang: "en-US",

      // Diagnostics
      diagnostics: {
        enabled: true,
        ui: true,
      },

      // Runtime state allow start/stop
      runtimeState: {
          enabled: true,
          ui: true,
      },

      // Logging
      logging: {
        console: {
          level: "debug",
          metrics: false,
          audit: true
        }
      },

      // FIXME: This is not cluster-ready
      contextStorage: {
        default: {
          module:"localfilesystem"
        },
      },

      // FIXME: Is this safe?
      exportGlobalContextKeys: true,

      // Allow modules
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


      editorTheme: {
        // FIXME: Custom theme?
        theme: "",

        // Disable welcome tour
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

      // Allow the Function node to load additional npm modules directly
      functionExternalModules: true,

      // Default timeout, in seconds, for the Function node. 0 means no timeout is applied
      functionTimeout: 1800,

      // Global context
      functionGlobalContext: { },

      // Max buffer size for nodes operating on messages
      nodeMessageBufferMaxLength: 1000,

      // Allow colors in the debug output
      debugUseColors: true,

      // Maximum debug length
      debugMaxLength: 1000,

      // Maximum buffer size for the exec node (25MB)
      execMaxBufferSize: 25000000,

      // Timeout in milliseconds for HTTP request connections (12s)
      httpRequestTimeout: 12000,
    }
  }
}
