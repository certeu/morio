import { resolveServiceConfiguration as api } from './api.mjs'
import { resolveServiceConfiguration as broker } from './broker.mjs'
import { resolveServiceConfiguration as ca } from './ca.mjs'
import { resolveServiceConfiguration as console } from './console.mjs'
import { resolveServiceConfiguration as connector } from './connector.mjs'
import { resolveServiceConfiguration as core } from './core.mjs'
import { resolveServiceConfiguration as db } from './db.mjs'
import { resolveServiceConfiguration as dbuilder } from './dbuilder.mjs'
import { resolveServiceConfiguration as proxy } from './proxy.mjs'
import { resolveServiceConfiguration as ui } from './ui.mjs'

const resolvers = {
  api,
  broker,
  ca,
  console,
  connector,
  core,
  db,
  dbuilder,
  proxy,
  ui,
}

export const resolveServiceConfiguration = (name, helpers) =>
  resolvers[name] ? resolvers[name](helpers) : false

/*
 * This is the order in which services are started
 */
export const serviceOrder = [
  'core',
  'db',
  'ca',
  'proxy',
  'api',
  'ui',
  'broker',
  'console',
  'connector',
  'dbuilder',
]

/*
 * This is the order in which services are started in ephemeral mode
 */
export const ephemeralServiceOrder = [
  'core',
  'proxy',
  'api',
  'ui',
]

