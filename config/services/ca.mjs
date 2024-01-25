/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (tools) => ({
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
    tag: '0.25.2',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Ports to export
    ports: ['9000:9000'],
    // Volumes
    volumes: [
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/ca:/home/step/config`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/ca/certs:/home/step/certs`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/ca/db:/home/step/db`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/ca/secrets:/home/step/secrets`,
    ],
    // Configure Traefik with container labels
    labels: [
      // Tell traefik to watch this container
      'traefik.enable=true',
      // Attach to the morio docker network
      `traefik.docker.network=${tools.getPreset('MORIO_NETWORK')}`,
      // Match requests going to the CA root certificate
      'traefik.http.routers.ca.rule=(PathPrefix(`/root`, `/acme`, `/provisioners`))',
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
        minTLSCertDuration: tools.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MIN'),
        maxTLSCertDuration: tools.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
        defaultTLSCertDuration: tools.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_DFLT'),
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
})
