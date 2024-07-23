import { core } from './utils.mjs'
import { describe, it } from 'node:test'

describe('Core Cluster Tests', () => {
  /*
   * POST /cluster/ping
   *
   * Example response:
   */
  it('Should POST /cluster/ping', async () => {
    const [status, d] = await core.post('/cluster/ping', {})
    console.log({ status, d })
  })
})
