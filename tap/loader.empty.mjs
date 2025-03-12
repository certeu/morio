/*
 * This file is here to prevent accidentally building a morio-tap
 * container image with a populated loader as that will break the service.
 * This will be copied to loader.mjs when building the container.
 */

// We need a logger
import { log } from './src/tools.mjs'

/*
 * Simple object with all stream processors
 */
export const allProcessors = {}

/*
 * Same stream processors but grouped by topic
 */
export const processorsPerTopic = {}

export const topics = []
export const processorList = []

log.warn(`An empty tap loader was loaded. This should not happen`)
