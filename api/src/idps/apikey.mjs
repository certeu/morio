import { storeLastLoginTime, loadApikey } from '../lib/apikey.mjs'
import { verifyPassword } from '#shared/crypto'
import { isRoleAvailable } from '../rbac.mjs'

/**
 * apikey: API key identity/authentication provider
 *
 * This method handles login/authentnication using the `apikey` provider
 *
 * @param {string} id - The provider ID. Should always be apikey in this case
 * @param {object} data - The data to authenticate with
 * @param {string} data.username - The username to verify (the key)
 * @param {string} data.password - The password to verify (the secret)
 * @return {[Bool, Object]} [result, data] - An array indicating result and data
 */
export const apikey = async (id, data) => {
  /*
   * Authenticate
   */
  if (id === 'apikey' && data?.username && data?.password && data?.role) {
    /*
     * Look up the apikey
     */
    const apikey = await loadApikey(data.username)
    if (!apikey)
      return [false, { success: false, reason: 'Authentication failed', error: 'No such API key' }]

    /*
     * Verify the password
     */
    const passwordOk = verifyPassword(data.password, apikey.secret)
    if (!passwordOk)
      return [false, { success: false, reason: 'Authentication failed', error: 'Invalid password' }]

    /*
     * Is the role accessible to this user?
     */
    const available = isRoleAvailable(apikey.role, data.role)
    if (!available)
      return [
        false,
        {
          success: false,
          reason: 'Authentication failed',
          error: 'Role not available to this API key',
        },
      ]

    /*
     * Update apikey with last login time
     */
    storeLastLoginTime(data.username)

    /*
     * All good, return
     */
    return [
      true,
      {
        user: `apikey.${data.username}`,
        role: data.role || 'user',
      },
    ]
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, { success: false, reason: 'Authentication failed', error: 'Input is invalid' }]
}
