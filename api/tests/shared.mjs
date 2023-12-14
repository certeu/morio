import chai from 'chai'
import http from 'chai-http'

const expect = chai.expect
chai.use(http)

export const setup = async () => ({
  chai,
  expect,
  store: {},
  config: {
    api: 'http://localhost:3000',
  },
})
