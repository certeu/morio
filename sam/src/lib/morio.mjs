import { fromEnv } from '#shared/env'
import { restClient } from '#shared/network'

/*
 * The Morio API url
 */
const api = `http://${fromEnv('MORIO_API_HOST')}:${fromEnv('MORIO_API_PORT')}`

/*
 * Client for the Morio API
 */
export const morioClient = restClient(api)
