import { fromEnv } from '#shared/env'
import { restClient } from '#shared/network'

/*
 * The CORE API url
 */
const api = `http://${fromEnv('MORIO_CORE_HOST')}:${fromEnv('MORIO_CORE_PORT')}`

/*
 * Client for the CORE API
 */
export const coreClient = restClient(api)
