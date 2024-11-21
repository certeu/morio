/*
 * This file is auto-generated when the container starts
 * and will be overwritten at the next restart
 */
import { log } from './src/tools.mjs'
import morio_watcher_healthchecks from './src/handlers/morio_watcher_healthchecks/index.mjs'
import morio_logs_cache from './src/handlers/morio_logs_cache/index.mjs'

const allHandlers = { morio_watcher_healthchecks,morio_logs_cache }
/*
 * We organise the message handlers per topic
 * This allows us to dispatch faster when there are
 * message handlers subscribed to different topics.
 */
export const handlers = {}
for (const [name, handler] of Object.entries(allHandlers)) {
  log.debug(`Message handler ${name} loaded for topic ${handler.topic}`)
  if (typeof handlers[handler.topic] === 'undefined') handlers[handler.topic] = new Set()
  handlers[handler.topic].add(handler)
}

export const topics = ["checks","logs"]
