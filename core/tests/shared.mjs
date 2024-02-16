import chai from 'chai'
import http from 'chai-http'
import { getPreset } from '#config'

const expect = chai.expect
chai.use(http)

export const setup = async () => ({
  chai,
  expect,
  store: {},
  config: {
    api: `http://localhost:${getPreset('MORIO_CORE_PORT')}`,
  },
})
