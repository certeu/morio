import { mrt } from './mrt.mjs'
import { ldap } from './ldap.mjs'
import { local } from './local.mjs'

/*
 * This object facilitates checking
 * the availability of a provider method
 */
export const idps = {
  mrt,
  ldap,
  local,
}
