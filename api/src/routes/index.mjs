import { routes as accounts } from '#routes/accounts'
import { routes as anonymous } from '#routes/anonymous'
import { routes as apikeys } from '#routes/apikeys'
import { routes as auth } from '#routes/auth'
import { routes as cache } from '#routes/cache'
import { routes as crypto } from '#routes/crypto'
import { routes as core } from '#routes/core'
import { routes as docs } from '#routes/docs'
import { routes as dconf } from '#routes/dconf'
import { routes as inventory } from '#routes/inventory'
import { routes as kv } from '#routes/kv'

export const routes = {
  anonymous,
  auth,
  accounts,
  apikeys,
  cache,
  core,
  crypto,
  dconf,
  docs,
  inventory,
  kv,
}
