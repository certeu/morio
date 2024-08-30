import { utils } from './utils.mjs'
import { generateJwt } from '#shared/crypto'
import axios from 'axios'

/*
 * A super minimal client to interact with Hashicorp Vault
 * Pretty much all Vault libraries out there expect to work
 * with a Vault token, but we use JWKS.
 * So, this minimal implementation will do the trick.
 */


export const vaultGetSecret = async (key, vault) => {
  const vconf = getVaultConfig(key, vault)
  const token = await getVaultToken(vconf)
  const secret = await getVaultSecret(vconf, token)

  return secret
    ? secret
    : false
}

const getVaultSecret = async (vconf, token) => {
  const result = await axios.get(
    `${vconf.url}/v1/${vconf.kv_path}/data/${vconf.path}`,
    { headers: { 'X-Vault-Token': token } }
  )

  return result?.data?.data?.data?.[vconf.key]
    ? result.data.data.data[vconf.key]
    : false
}

const getVaultToken = async (vconf) => {
  /*
   * Generate JSON Web Token
   */
  const jwt = await generateJwt({
    data: {
      morio: true,
      node: utils.getNodeUuid(),
      cluster: utils.getClusterUuid(),
      trigger: 'core_settings',
      secret_key: vconf.key,
      kv_path: vconf.kv_path,
    },
    key: utils.getKeys().private,
    passphrase: utils.getKeys().mrt,
    options: {
      expiresIn: '3m',
      issuer: utils.getClusterFqdn()
    }
  })

  /*
   * Authenticate with JWT to get a Vault token
   */
  const result = await axios.post(
    `${vconf.url}/v1/auth/${vconf.jwt_auth_path}/login`,
    { jwt, role: vconf.role },
  )

  return result?.data?.auth?.client_token
    ? result.data.auth.client_token
    : false
}

const getVaultConfig = (key, vault) => {
  const defaults = {
    role: 'morio',
    jwt_auth_path: 'morio',
    kv_path: 'secret',
  }
  let vconf = {}
  if (typeof vault === 'string') {
    /*
     * Vault entries can be specified as a string as such:
     *   path:key@instance
     * If instance is not set, we use the settings.vault
     * If isntance is set, we use settings.vaults[instance]
     * If key is not set, we use the key passed to this method
     * This regex does the trick
     */
    const re = /^([^:]+)(?::([^@]*))?(?:@(.+))?$/
    const result = vault.match(re)
    vconf.path = result[1]
    vconf.key = result[2] || key
    if (result[3]) vconf = { ...vconf, ...utils.getSettings(['vaults', result[3]], {}) }
    else vconf = { ...defaults, ...vconf, ...utils.getSettings('vault', {}) }
  }
  else {
    /*
     * If it's not a string, that makes it easier
     */
    if (vault.instance) vconf = { ...defaults, ...utils.getSettings(['vaults', vault.instance], {}), ...vault }
    else vconf = { ...defaults, ...utils.getSettings('vault', {}), ...vault }
  }

  return vconf
}
