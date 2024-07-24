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
  499: 'Morio status is unknown because it was never set',
}

export const statusCodeAsColor = (code) => code === 0 ? 'green' : code < 500 ? 'amber' : 'green'
