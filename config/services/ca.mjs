import { YamlConfig } from '../yaml-config.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Port the service will listen on
   */
  const PORT = utils.getPreset('MORIO_CA_PORT')

  return {
    /*
     * Wait for this service to come up before continue
     */
    await: true,
    /*
     * Container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'ca',
      // Image to run (different in dev)
      image: 'smallstep/step-ca',
      // Image tag (version) to run
      tag: '0.26.1',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/ca:/home/step/config`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/ca/certs:/home/step/certs`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/ca/db:/home/step/db`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/ca/secrets:/home/step/secrets`,
          ]
        : [
            `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/ca:/home/step/config`,
            `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/certs:/home/step/certs`,
            `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/db:/home/step/db`,
            `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/secrets:/home/step/secrets`,
          ],
    },
    /*
     * Traefik (proxy) configuration for the CA service
     */
    traefik: new YamlConfig()
      .set(
        'http.routers.ca.rule',
        '( PathPrefix(`/root`) || PathPrefix(`/acme`) || PathPrefix(`/provisioners`) )'
      )
      .set('http.routers.ca.priority', 666)
      .set('http.routers.ca.service', 'ca')
      .set('http.services.ca.loadBalancer.servers', { url: `https://ca:${PORT}/` })
      .set('http.routers.ca.tls', true)
      .set('http.routers.stepca.entryPoints', 'stepca')
      .set('http.routers.stepca.rule', 'PathPrefix(`/`)')
      .set('http.routers.stepca.priority', 666)
      .set('http.routers.stepca.service', 'ca')
      .set('http.routers.stepca.tls', true)
      .set('http.services.stepca.loadBalancer.servers', { url: `https://ca:${PORT}/` }),
    /*
     * Step-CA server configuration
     */
    server: {
      root: '/home/step/certs/root_ca.crt',
      federatedRoots: null,
      crt: '/home/step/certs/intermediate_ca.crt',
      key: '/home/step/secrets/intermediate_ca_key',
      address: `:${PORT}`,
      insecureAddress: '',
      dnsNames: ['ca.internal.morio.it', 'localhost', 'ca'],
      logger: {
        format: 'json',
      },
      db: {
        type: 'badgerv2',
        dataSource: '/home/step/db',
      },
      clr: {
        enabled: false,
      },
      authority: {
        claims: {
          minTLSCertDuration: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MIN'),
          maxTLSCertDuration: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
          defaultTLSCertDuration: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_DFLT'),
          disableRenewal: false,
          allowRenewalAfterExpiry: true,
        },
        provisioners: [
          {
            type: 'JWK',
            name: 'admin',
            key: null,
            encryptedKey: null,
          },
          {
            type: 'ACME',
            name: 'acme',
            forceCN: true,
            challenges: ['http-01'],
          },
        ],
      },
      tls: {
        cipherSuites: [
          'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
          'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
        ],
        minVersion: 1.2,
        maxVersion: 1.3,
        renegotiation: false,
      },
    },
    /*
     * Step-CA client configuration
     */
    client: {
      'ca-url': `https://localhost:${PORT}`,
      'ca-config': '/home/step/config/ca.json',
      fingerprint: null, // Will be set by core
      root: '/home/step/certs/root_ca.crt',
    },
  }
}
