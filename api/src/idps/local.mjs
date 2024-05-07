import { storeLastLoginTime, loadAccount } from '../lib/account.mjs'
import { verifyPassword } from '#shared/crypto'
import { mfa } from '../lib/mfa.mjs'
import { isRoleAvailable } from '../rbac.mjs'
import { store } from '../lib/store.mjs'

/**
 * local: Local Morio identity/authentication provider
 *
 * This method handles login/authentnication using the `local` provider
 *
 * @param {string} id - The provider ID. Should always be local in this case
 * @param {object} data - The data to authenticate with
 * @param {string} data.username - The username to verify
 * @param {string} data.password - The password to verify
 * @param {string} data.token - The MFA token to verify
 * @return {[Bool, Object]} [result, data] - An array indicating result and data
 */
export const local = async (id, data) => {
  /*
   * Authenticate
   */
  if (id === 'local' && data?.username && data?.password && data?.token && data?.role) {
    /*
     * Look up the account
     */
    const account = await loadAccount('local', data.username)
    if (!account)
      return [false, { success: false, reason: 'Authentication failed', error: 'No such account' }]

    /*
     * Verify the password
     */
    const passwordOk = verifyPassword(data.password, account.password)
    if (!passwordOk)
      return [false, { success: false, reason: 'Authentication failed', error: 'Invalid password' }]

    /*
     * Is the role accessible to this user?
     */
    const available = isRoleAvailable(account.role, data.role)
    if (!available)
      return [
        false,
        {
          success: false,
          reason: 'Authentication failed',
          error: 'Role not available to this user',
        },
      ]

    /*
     * Verify MFA
     */
    const mfaOk = await mfa.verify(
      data.token,
      await store.decrypt(account.mfa),
      account.scratchCodes
    )
    if (mfaOk[0]) {
      /*
       * Update scratchcodes in case they were used
       */
      storeLastLoginTime('local', data.username, { scratchCodes: mfaOk[1] })

      /*
       * All good, return
       */
      return [
        true,
        {
          user: `local.${data.username}`,
          role: data.role || 'user',
        },
      ]
    } else
      return [
        false,
        {
          success: false,
          reason: 'Authentication requires MFA',
          error: 'Please provide your MFA token',
        },
      ]
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, { success: false, reason: 'Authentication failed', error: 'Input is invalid' }]
}
