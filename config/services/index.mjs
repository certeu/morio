import { resolveServiceConfiguration as api } from './api.mjs'
import { resolveServiceConfiguration as broker } from './broker.mjs'
import { resolveServiceConfiguration as ca } from './ca.mjs'
import { resolveServiceConfiguration as console } from './console.mjs'
import { resolveServiceConfiguration as core } from './core.mjs'
import { resolveServiceConfiguration as proxy } from './proxy.mjs'
import { resolveServiceConfiguration as ui } from './ui.mjs'
import { resolveServiceConfiguration as dbuilder } from './dbuilder.mjs'

const resolvers = {
  api,
  broker,
  ca,
  console,
  core,
  dbuilder,
  proxy,
  ui,
}

export const resolveServiceConfiguration = (name, tools) =>
  resolvers[name] ? resolvers[name](tools) : false
