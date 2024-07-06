/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ store, utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.get('info.production', false)

  return {
    /**
    * Container configuration
    *
    * @param {object} config - The high-level Morio configuration
    * @return {object} container - The container configuration
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
      // Ports to export
      ports: ['9000:9000'],
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/ca:/home/step/config`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/ca/certs:/home/step/certs`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/ca/db:/home/step/db`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/ca/secrets:/home/step/secrets`,
      ] : [
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/ca:/home/step/config`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/certs:/home/step/certs`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/db:/home/step/db`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/secrets:/home/step/secrets`,
      ],
      // Configure Traefik with container labels
      labels: [
        // Tell traefik to watch this container
        'traefik.enable=true',
        // Attach to the morio docker network
        `traefik.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
        // Match requests going to the CA root certificate
        'traefik.http.routers.ca.rule=( PathPrefix(`/root`) || PathPrefix(`/acme`) || PathPrefix(`/provisioners`) )',
        // Set priority to avoid rule conflicts
        'traefik.http.routers.ca.priority=120',
        // Forward to the CA api
        'traefik.http.routers.ca.service=ca',
        // Forward to port on container
        'traefik.http.services.ca.loadbalancer.server.port=9000',
        // Enable TLS
        'traefik.http.routers.ca.tls=true',
        // Enable backend TLS
        'traefik.http.services.ca.loadbalancer.server.scheme=https',
      ],
    },
    /*
    * Step-CA server configuration
    */
    server: {
      root: '/home/step/certs/root_ca.crt',
      federatedRoots: null,
      crt: '/home/step/certs/intermediate_ca.crt',
      key: '/home/step/secrets/intermediate_ca_key',
      address: ':9000',
      insecureAddress: '',
      dnsNames: ['localhost', 'ca'],
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
      'ca-url': 'https://localhost:9000',
      'ca-config': '/home/step/config/ca.json',
      fingerprint: null, // Will be set by core
      root: '/home/step/certs/root_ca.crt',
    },
  }
}
