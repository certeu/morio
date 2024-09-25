export const presetDocs = {
  MORIO_API_JWT_EXPIRY:
    'The expiration time of the [JSON Web Tokens (JWT)](https://jwt.io/) generated to authenticate to Morio.',
  MORIO_API_LOG_LEVEL: `Log level of the Morio API. One of:
  - \`trace\`
  - \`debug\`
  - \`info\`
  - \`warn\`
  - \`error\`
  - \`fatal\`
  - \`silent\``,
  MORIO_API_PORT: 'The port the Morio Management API listens on inside the container',
  MORIO_API_PREFIX: 'The URL path prefix that is used to access the Morio management API',
  MORIO_BROKER_LOG_LEVEL: `Log level of the Red Panda broker. One of:
  - \`trace\`
  - \`debug\`
  - \`info\`
  - \`warn\`
  - \`error\``,
  MORIO_BROKER_TOPICS: 'A list of topics to created when bootstrapping the broker',
  MORIO_BROKER_UID: 'The UID under which the broker runs inside the container.',
  MORIO_CA_CERTIFICATE_LIFETIME_DFLT:
    'The default lifetime for certificates issued by the Morio internal Certificate Authrority (CA). Note that `h` is [the largest supported time unit](https://pkg.go.dev/time#ParseDuration).',
  MORIO_CA_CERTIFICATE_LIFETIME_MAX:
    'The maximum lifetime for certificates issued by the Morio internal Certificate Authrority (CA). Note that `h` is [the largest supported time unit](https://pkg.go.dev/time#ParseDuration).',
  MORIO_CA_CERTIFICATE_LIFETIME_MIN:
    'The minimum lifetime for certificates issued by the Morio internal Certificate Authrority (CA). Note that `h` is [the largest supported time unit](https://pkg.go.dev/time#ParseDuration).',
  MORIO_CA_UID: 'The UID under which the CA runs inside the container.',
  MORIO_CONSOLE_PREFIX: 'The URL path prefix that is used to access the Traefik console.',
  MORIO_CORE_CONFIG_FOLDER: 'The location where morio configuration is stored.',
  MORIO_CORE_LOG_LEVEL: `Log level of Morio core. One of:
  - \`trace\`
  - \`debug\`
  - \`info\`
  - \`warn\`
  - \`error\`
  - \`fatal\`
  - \`silent\``,
  MORIO_CORE_PORT: 'The port Morio core listens on inside the container.',
  MORIO_DOCKER_SOCKET: 'Location of the Docker socket on the host OS',
  MORIO_INTERMEDIATE_CA_COMMON_NAME:
    'Common Name (CN) of the Morio Intermediate Certificate Authority.',
  MORIO_INTERMEDIATE_CA_VALID_YEARS: 'Validity of the intermediate CA certificate, in years.',
  MORIO_NETWORK: 'Name of the Docker network used to link Morio services',
  MORIO_PROXY_ACCESS_LOG_FILEPATH: 'Location to store the Traefik access log.',
  MORIO_PROXY_LOG_FILEPATH: 'Location to store the Traefik log.',
  MORIO_PROXY_LOG_FORMAT: 'Format of the Traefik logs',
  MORIO_PROXY_LOG_LEVEL: `Log level of the proxy service (Traefik). One of:
  - \`DEBUG\`
  - \`INFO\`
  - \`WARN\`
  - \`FATAL\`
  - \`PANIC\``,
  MORIO_GIT_ROOT: 'Root folder of the Morio git repository on the build host',
  MORIO_ROOT_CA_COMMON_NAME: 'Common Name (CN) of the Morio Root Certificate Authority',
  MORIO_ROOT_CA_VALID_YEARS: 'Validity of the root CA certificate, in years.',
  MORIO_UI_PORT: 'The port the Morio UI listens on inside the container',
  MORIO_UI_TIMEOUT_URL_CHECK: 'Default timeout (in milliseconds) when testing a Morio URL',
  MORIO_VERSION: 'The current Morio version',
  MORIO_VERSION_EPOCH: 'Release date of the current Morio version',
  MORIO_X509_C:
    'Default Country Code (C) to use for certificates issued by the Morio Certificate Authority',
  MORIO_X509_CN:
    'Default Common Name (CN) to use for certificates issued by the Morio Certificate Authority',
  MORIO_X509_L:
    'Default Locality (L) to use for certificates issued by the Morio Certificate Authority',
  MORIO_X509_O:
    'Default Organization (O) to use for certificates issued by the Morio Certificate Authority',
  MORIO_X509_OU:
    'Default Organizational Unit (OU) to use for certificates issued by the Morio Certificate Authority',
  MORIO_X509_ST:
    'Default State (ST) to use for certificates issued by the Morio Certificate Authority',
}

export const presetCategories = {
  API: 'Management API',
  BROKER: 'Broker (RedPanda)',
  CA: 'Certificate Authirity (SmallStep)',
  CONSOLE: 'Console (RedPanda Console)',
  CORE: 'Core',
  DOCKER: 'Docker',
  PROXY: 'Proxy (Traefik)',
  REPO: 'Repository',
  UI: 'Web Interface',
  VERSION: 'Version',
  X509: 'X509 Certificates',
}
