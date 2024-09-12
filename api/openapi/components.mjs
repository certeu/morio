import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'

export const components = {
  schemas: {
    //Authentication: {
    //  apikey: j2s(schema[`req.auth.login.apikey`]).swagger,
    //  local: j2s(schema[`req.auth.login.local`]).swagger,
    //  mrt: j2s(schema[`req.auth.login.mrt`]).swagger,
    //  ldap: j2s(schema[`req.auth.login.ldap`]).swagger,
    //},
    Request: {
      login: {
        apikey: j2s(schema[`req.auth.login.apikey`]).swagger,
        local: j2s(schema[`req.auth.login.local`]).swagger,
        mrt: j2s(schema[`req.auth.login.mrt`]).swagger,
        ldap: j2s(schema[`req.auth.login.ldap`]).swagger,
      },
    },
    Response: {
      login: {
        apikey: j2s(schema[`res.auth.login.apikey`]).swagger,
        local: j2s(schema[`res.auth.login.local`]).swagger,
        mrt: j2s(schema[`res.auth.login.mrt`]).swagger,
        ldap: j2s(schema[`res.auth.login.ldap`]).swagger,
      },
    },
  },
  securitySchemes: {
    api_key: { type: 'http', scheme: 'basic' },
    jwt_bearer: { type: 'http', scheme: 'bearer' },
    jwt_cookie: { type: 'apiKey', in: 'cookie', name: 'morio' },
  },
}
