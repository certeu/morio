import { roles } from '#config/roles'
import { utils } from '../lib/utils.mjs'
import { updateLastLoginTime } from '../lib/account.mjs'
import { isRoleAvailable } from '../rbac.mjs'

/**
 * mrt: Morio Root Token identtiy/authentication provider
 *
 * This method handles login/authentnication using the `mrt` provider
 *
 * @param {string} id - The provider ID. Should always be mrt in this case
 * @param {object} data - The data to authenticate with
 * @param {string} data.mrt - The root token to verify
 * @return {[Bool, Object]} [result, data] - An array indicating result and data
 */
export async function mrt(id, data) {
  /*
   * Authenticate
   */
  const keys = utils.getKeys()
  if (!keys?.mrt) return false
  if (id === 'mrt' && data.mrt === keys.mrt) {
    /*
     * Update the latest login time, but don't wait for it
     */
    updateLastLoginTime('mrt', 'root')

    /*
     * Is the role available? Since this is the root token,
     * this boils down to: Does the role exist?
     */
    const available = isRoleAvailable('root', data.role)
    if (!available)
      return [
        false,
        'morio.api.account.role.unavailable',
        {
          requested_role: data.role,
          available_roles: roles,
        },
      ]

    /*
     * Return result
     */
    return [
      true,
      {
        user: 'root',
        role: data.role || 'user',
        available_roles: roles,
        highest_role: 'root',
        provider: id,
      },
    ]
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, 'morio.api.account.credentials.mismatch']
}
