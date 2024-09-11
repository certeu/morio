import { useState } from 'react'
import { RoleInput } from '../inputs.mjs'

/**
 * The login for an OIDC provider
 */
export const OidcProvider = ({ id, api, setLoadingStatus, setAccount, setError }) => {
  const [role, setRole] = useState('user')

  return (
    <>
      {/* FIXME: This uses the hardcoded API prefix, which should come from a preset */}
      <form method="POST" action="/-/api/login-form">
        <input type="hidden" name="provider" value={id} />
        <input type="hidden" name="role" value={role} />
        <RoleInput {...{ role, setRole }} maxRole="engineer" />
        <button role="submit" className="btn btn-lg btn-primary w-full">
          Sign in
        </button>
      </form>
    </>
  )
}
