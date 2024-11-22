/*
 * This file is auto-generated every time the morio-tap container starts.
 * It will be overwritten at the next restart.
 *
 * Tap handlers can be loaded dynamically, which is handled by the
 * containers entrypoint which will auto-generate this file which
 * loads all tap handlers.
 *
 * A tap handler is a handler for Morio's Tap service that allows
 * you to 'tap into' the streaming data without having to write code
 * to handle streaming data.
 */

// We need a logger
import { log } from './src/tools.mjs'

// Tap handlers
import morio_watcher_healthchecks from './src/handlers/morio_watcher_healthchecks/index.mjs'
import morio_logs_cache from './src/handlers/morio_logs_cache/index.mjs'
import morio_inventory from './src/handlers/morio_inventory/index.mjs'
import mod_metrics_morio_tap from './src/handlers/mod_metrics_morio_tap/index.mjs'

/*
 * Simple object with all tap handlers
 */
export const allHandlers = {
  morio_watcher_healthchecks,
  morio_logs_cache,
  morio_inventory__0: morio_inventory[0], 
  morio_inventory__1: morio_inventory[1], 
  mod_metrics_morio_tap,
}

/*
 * Same tap handlers but grouped by topic
 */
export const handlersPerTopic = {
  checks: [
    allHandlers.morio_watcher_healthchecks,
  ],
  logs: [
    allHandlers.morio_logs_cache,
  ],
  metrics: [
    allHandlers.morio_inventory__0,,
    allHandlers.mod_metrics_morio_tap,
  ],
  inventory: [
    allHandlers.morio_inventory__1,
  ],
}

export const topics = ["checks","logs","metrics","inventory"]
export const handlerList = Object.keys(allHandlers)
