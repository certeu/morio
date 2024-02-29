import { resolveServiceConfiguration as api } from './api.mjs'
import { resolveServiceConfiguration as broker } from './broker.mjs'
import { resolveServiceConfiguration as ca } from './ca.mjs'
import { resolveServiceConfiguration as console } from './console.mjs'
import { resolveServiceConfiguration as connector } from './connector.mjs'
import { resolveServiceConfiguration as core } from './core.mjs'
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
  dbuilder,
  proxy,
  ui,
}

export const resolveServiceConfiguration = (name, store) =>
  resolvers[name] ? resolvers[name](store) : false
