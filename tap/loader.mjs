/*
 * This file is auto-generated when the container starts
 * and will be overwritten at the next restart
 */
import { log } from './src/tools.mjs'
import morio_watcher_healthchecks from './src/handlers/morio_watcher_healthchecks/index.mjs'
import morio_logs_cache from './src/handlers/morio_logs_cache/index.mjs'
import morio_inventory__0 from './src/handlers/morio_inventory__0/index.mjs'
import mod_metrics_morio-tap from './src/handlers/mod_metrics_morio-tap/index.mjs'

const allHandlers = { morio_watcher_healthchecks,morio_logs_cache,morio_inventory__0,mod_metrics_morio-tap }
/*
 * We organise the message handlers per topic
 * This allows us to dispatch faster when there are
 * message handlers subscribed to different topics.
 */
export const handlers = {}
for (const [name, handler] of Object.entries(allHandlers)) {
  log.debug(`Message handler ${name} loaded for topic ${handler.topic}`)
  if (typeof handlers[handler.topic] === 'undefined') handlers[handler.topic] = new Set()
  handlers[handler.topic].add({ ...handler, name })
}

export const topics = ["checks","logs","metrics"]

export const handlerList = Object.keys(allHandlers)
