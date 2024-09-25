import { updateLastLoginTime, loadApikey } from '../lib/apikey.mjs'
import { verifyPassword } from '#shared/crypto'

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
export async function apikey(id, data) {
  /*
   * Authenticate
   */
  if (id === 'apikey' && data?.api_key && data?.api_key_secret) {
    /*
     * Look up the apikey
     */
    const apikey = await loadApikey(data.api_key)
    if (!apikey)
      return [false, { success: false, reason: 'Authentication failed', error: 'No such API key' }]

    /*
     * Verify the password
     */
    const passwordOk = verifyPassword(data.api_key_secret, apikey.secret)
    if (!passwordOk)
      return [false, { success: false, reason: 'Authentication failed', error: 'Invalid password' }]

    /*
     * Update apikey with last login time
     */
    updateLastLoginTime(data.api_key)

    /*
     * All good, return
     */
    return [
      true,
      {
        user: `apikey.${data.api_key}`,
        role: apikey.role,
        provider: id,
      },
    ]
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, { success: false, reason: 'Authentication failed', error: 'Input is invalid' }]
}
