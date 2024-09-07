import { pullConfig as broker } from './services/broker.mjs'
import { pullConfig as ca } from './services/ca.mjs'
import { pullConfig as connector } from './services/connector.mjs'
import { pullConfig as console } from './services/console.mjs'
import { pullConfig as db } from './services/db.mjs'
import { pullConfig as proxy } from './services/proxy.mjs'
import { pullConfig as watcher } from './services/watcher.mjs'

export const pullConfig = {
  broker,
  ca,
  connector,
  console,
  db,
  proxy,
  watcher,
}
