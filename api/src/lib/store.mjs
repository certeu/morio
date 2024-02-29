import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'

export const store = new Store()
  .set('log', logger(getPreset('MORIO_API_LOG_LEVEL'), 'api'))
  .set('prefix', getPreset('MORIO_API_PREFIX'))
