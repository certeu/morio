// Load utils
import { utils } from './utils.mjs'

/**
 * Helper method to determine whether the tap service is wanted
 *
 * This is here to avoid import loops
 *
 * @return {bool} wanted - True if wanted, false if not
 */
export function isTapWanted() {
  const processors = utils.getSettings('tap', {})

  return Object.keys(processors).length > 0
}
