import { useState, useEffect } from 'react'
import { SecretInput, ListInput } from '../inputs.mjs'

/**
 * Roles supported by this provider
 */
const roles = ['user', 'manager', 'operator', 'engineer', 'root']

/**
 * The login for for the Morio Root Token provider
 */
export const MrtProvider = ({ api, setLoadingStatus, setAccount, setError }) => {
  const [mrt, setMrt] = useState('')
  const [role, setRole] = useState(false)

  const submit = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.login('mrt', { mrt, role })
    if (result?.[1] === 200 && result?.[0]?.jwt) {
      setLoadingStatus([true, 'Authentication Succeeded', true, true])
      setError(false)
      setAccount(result[0].jwt)
    } else {
      setLoadingStatus([true, `Authentication Failed`, true, false])
      setAccount(null)
      if (result?.[0]?.error) setError(result[0].error)
    }
  }

  return (
    <>
      <SecretInput
        label="Morio Root Token"
        labelBL="The Morio Root Token was generated when you initially setup Morio"
        current={mrt}
        update={setMrt}
        valid={valid}
      />
      <ListInput
        label="Role"
        labelBL="Not selecting any role will result in all roles being assigned"
        dense
        dir="row"
        update={(val) => (role === val ? setRole(false) : setRole(val))}
        current={role}
        list={roles.map((role) => ({ val: role, label: role }))}
      />
      <button className="btn btn-lg btn-primary w-full" disabled={!valid(mrt)} onClick={submit}>
        Sign in
      </button>
    </>
  )
}

/**
 * Helper method to see whether the input is valid
 *
 * Morio Root Tokens are a string of 68 characters, that starts with `mrt.`
 */
const valid = (token) =>
  typeof token === 'string' && token.length === 68 && token.slice(0, 4) === 'mrt.'
