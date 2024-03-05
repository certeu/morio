import { AuthLayout } from './layout.mjs'
import { Login } from './login.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { useEffect, useState } from 'react'
import { LogoSpinner } from 'components/animations.mjs'

const OneMomentPlease = () => (
  <AuthLayout>
    <div className="w-full max-w-2xl m-auto">
      <h2 className="w-full flex flex-row justify-between items-center">
        <div className="w-12">
          <LogoSpinner />
        </div>
        One moment please
      </h2>
    </div>
  </AuthLayout>
)

export const AuthWrapper = ({ role, account, setAccount, children }) => {
  /*
   * If the user is not logged in, show login form
   */
  if (!account)
    return (
      <AuthLayout>
        <Login setAccount={setAccount} />
      </AuthLayout>
    )

  /*
   * If the user is logged in and has the required role, show content
   */
  if (Array.isArray(account.roles) && account.roles.includes(role)) return children

  /*
   * If the user is logged in but does not have the required role, show warning
   */
  return (
    <AuthLayout>
      <Login {...{ setAccount, account, role }} />
    </AuthLayout>
  )
}
