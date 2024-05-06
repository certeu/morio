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
   * The frontend UI will pass us the provider ID, which we then use
   * to lookup the provider config in the settings.
   * However, the apikey provider does not need to be configured
   * by the user in the settings.
   *
   * A user could, intentionally or by accident, create a different
   * authentication provider and give it the ID 'apikey'. In that case,
   * the UI would submit a login request where the ID 'apikey' would be used
   * on a provider that is different from the local provider.
   *
   * So while that is an unlikely scenario, best to guard against it and give
   * a meaningful error message.
   */
  if (id !== 'apikey') {
    return [
      false,
      {
        success: false,
        reason: 'Authentication failed',
        error: 'Called the apikey provider with an id that is not `apikey`',
      },
    ]
  }

  /*
   * Now authenticate
   */
  if (data?.username && data?.password && data?.role) {
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
