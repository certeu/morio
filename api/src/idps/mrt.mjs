import { store } from '../lib/store.mjs'
import { storeLastLoginTime } from '../lib/account.mjs'

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
   * The frontend UI will pass us the provider ID, which we then use
   * to lookup the provider config in the settings.
   * However, the root token provider does not need to be configured
   * by the user in the settings. It is always available unless disabled
   * by a feature flag.
   *
   * A user could, intentionally or by accident, create a different
   * authentication provider and give it the ID 'mrt'. In that case,
   * the UI would submit a login request where the ID 'mrt' would be used
   * on a provider that is differnet from the root token provider.
   *
   * So while that is an unlikely scenario, best to guard against it and give
   * a meaningful error message.
   */
  if (id !== 'mrt') {
    return [
      false,
      {
        success: false,
        reason: 'Authentication failed',
        error: 'Called the Root Token provider with an id that is not `mrt`',
      },
    ]
  }

  /*
   * Now authenticate
   */
  if (data.mrt === store.keys.mrt) {
    /*
     * Store the latest login time, but don't wait for it
     */
    storeLastLoginTime('mrt', 'root')

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
