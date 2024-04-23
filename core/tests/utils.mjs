import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'
import { restClient } from './rest.mjs'

/*
 * Setup the store
 */
const store = new Store().set('log', logger('trace'))

/*
 * Client for the core API (which we are testing)
 */
const core = restClient(`http://localhost:${getPreset('MORIO_CORE_PORT')}`)

export {
  core,
  getPreset,
  store,
}

