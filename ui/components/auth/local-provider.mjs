import { useState } from 'react'
import { SecretInput, StringInput, RoleInput } from '../inputs.mjs'

/**
 * The login form for any provider that takes username + password
 */
export const LocalProvider = ({ id, api, setLoadingStatus, setAccount, setError }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [role, setRole] = useState('user')

  const submit = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.login(id, { username, password, token, role })
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
      <StringInput
        label="Username"
        current={username}
        update={setUsername}
        valid={(val) => val.length > 0}
      />
      <div className="grid grid-cols-2 gap-2">
        <SecretInput label="Password" current={password} update={setPassword} valid={() => true} />
        <StringInput label="MFA Token" current={token} update={setToken} valid={() => true} />
      </div>
      <RoleInput {...{ role, setRole }} />
      <button
        className="btn btn-lg btn-primary w-full"
        disabled={username.length < 1}
        onClick={submit}
      >
        Sign in
      </button>
    </>
  )
}
