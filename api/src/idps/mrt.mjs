import { store } from '../lib/utils.mjs'
import { storeLastLoginTime } from '../lib/account.mjs'
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
export const mrt = async (id, data) => {

  /*
   * Authenticate
   */
  if (id === 'mrt' && data.mrt === store.keys.mrt) {
    /*
     * Store the latest login time, but don't wait for it
     */
    storeLastLoginTime('mrt', 'root')

    /*
     * Is the role available? Since this is the root token,
     * this boils down to: Does the role exist?
     */
    const available = isRoleAvailable('root', data.role)
    if (!available)
      return [
        false,
        {
          success: false,
          reason: 'Authentication failed',
          error: 'Role not available',
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
      },
    ]
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, { success: false, reason: 'Authentication failed', error: 'Invalid token' }]
}
