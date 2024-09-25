import { routes as anonymous } from '#routes/anonymous'
import { routes as core } from '#routes/core'
import { routes as auth } from '#routes/auth'
import { routes as accounts } from '#routes/accounts'
import { routes as apikeys } from '#routes/apikeys'
import { routes as crypto } from '#routes/crypto'
import { routes as docs } from '#routes/docs'
import { routes as kv } from '#routes/kv'

export const routes = {
  anonymous,
  auth,
  accounts,
  apikeys,
  core,
  crypto,
  docs,
  kv,
}
