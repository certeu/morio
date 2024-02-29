import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'

export const store = new Store()
  .set('log', logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core'))
  .set('status_logs', new Set())
  .set('log.status', (msg) => {
    store.status_logs.add({ time: Date.now(), msg })
    if (store.status_logs.size > 20) store.status_logs = new Set([...store.status_logs].slice(-20))
  })
