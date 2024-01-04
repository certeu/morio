import { fromEnv } from '#shared/env'
import { restClient } from '#shared/network'

/*
 * The SAM API url
 */
const api = `http://${fromEnv('MORIO_SAM_HOST')}:${fromEnv('MORIO_SAM_PORT')}`

/*
 * Client for the SAM API
 */
export const samClient = restClient(api)
