import { useState, useEffect } from 'react'
import { SecretInput, RoleInput } from '../inputs.mjs'

/**
 * The login for for the Morio Root Token provider
 */
export const MrtProvider = ({ id, api, setLoadingStatus, setAccount, setError }) => {
  const [mrt, setMrt] = useState('')
  const [role, setRole] = useState('user')

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
      <RoleInput {...{ role, setRole }} />
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
