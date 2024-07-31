import { updateLastLoginTime, loadAccount } from '../lib/account.mjs'
import { verifyPassword } from '#shared/crypto'
import { mfa } from '../lib/mfa.mjs'
import { isRoleAvailable, availableRoles } from '../rbac.mjs'
import { utils } from '../lib/utils.mjs'

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
    if (!account) return [false, 'morio.api.account.unknown']

    /*
     * Verify the password
     */
    const passwordOk = verifyPassword(data.password, account.password)
    if (!passwordOk) return [false, 'morio.api.account.credentials.mismatch']

    /*
     * Is the role accessible to this user?
     */
    const available = isRoleAvailable(account.role, data.role)
    if (!available)
      return [
        false,
        'morio.api.account.role.unavailable',
        {
          requested_role: data.role,
          available_roles: availableRoles(data.role),
        },
      ]

    /*
     * Verify MFA
     */
    const mfaOk = await mfa.verify(
      data.token,
      await utils.decrypt(account.mfa),
      account.scratch_codes
    )
    if (mfaOk[0]) {
      /*
       * Update scratch codes in case they were used
       */
      updateLastLoginTime('local', data.username, { scratch_codes: mfaOk[1] })
      /*
       * All good, return
       */
      return [
        true,
        {
          user: `local.${data.username}`,
          role: data.role || 'user',
          available_roles: availableRoles(account.role),
          highest_role: account.role,
          provider: id,
        },
      ]
    }
  }

  /*
   * If we get here, it means authentication failed
   */
  return [false, 'morio.api.account.credentials.mismatch']
}
