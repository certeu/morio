import chai from 'chai'
import http from 'chai-http'
import { fromEnv } from '@morio/lib/env'

const expect = chai.expect
chai.use(http)

export const setup = async () => ({
  chai,
  expect,
  store: {},
  config: {
    api: `http://localhost:${fromEnv('MORIO_SAM_PORT')}`,
  },
})
