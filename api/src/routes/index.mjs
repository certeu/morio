import { routes as core } from '#routes/core'
import { routes as status } from '#routes/status'
import { routes as validate } from '#routes/validate'
import { routes as auth } from '#routes/auth'
import { routes as accounts } from '#routes/accounts'
import { routes as apikeys } from '#routes/apikeys'

export const routes = {
  auth,
  accounts,
  apikeys,
  core,
  status,
  validate,
}
