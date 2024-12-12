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

/*
 * Simple object with all tap handlers
 */
export const allHandlers = {
}

/*
 * Same tap handlers but grouped by topic
 */
export const handlersPerTopic = {
}

export const topics = []
export const handlerList = Object.keys(allHandlers)
