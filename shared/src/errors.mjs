export const serviceCodes = {
  core: 10,
  api: 11,
  ca: 12,
  broker: 13,
  db: 14,
  console: 15,
  ui: 16,
  proxy: 17,
  connector: 18,
  dbuilder: 19,
}

export const statusCodes = {
  0: 'Everything is ok',
  1: 'Morio is running in ephemeral mode',
  2: 'Morio is resolving the configuration',
  10: 'There is an issue with the core service',
  11: 'There is an issue with the api service',
  12: 'There is an issue with the ca service',
  13: 'There is an issue with the broker service',
  14: 'There is an issue with the db service',
  15: 'There is an issue with the console service',
  16: 'There is an issue with the ui service',
  17: 'There is an issue with the proxy service',
  18: 'There is an issue with the connector service',
  19: 'There is an issue with the dbuilder service',
}

export function statusCodeAsColor(code) {
  return code === 0
    ? 'green'
    : code < 500
    ? 'amber'
    : 'green'
}
