import { restClient } from '#shared/network'

/*
 * Client for the CORE API
 */
export const coreClient = (api) => restClient(api)
