import { AuthLayout } from './layout.mjs'
import { Login } from './login.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { useEffect, useState } from 'react'
import { RightIcon, MorioIcon, DarkThemeIcon, LightThemeIcon } from 'components/icons.mjs'
import { LogoSpinner, CountdownCircle } from 'components/animations.mjs'
import { Arrows } from './layout.mjs'
import { roles } from 'config/roles.mjs'

const OneMomentPlease = () => (
  <div className="grid grid-cols-1 h-screen bg-gradient-to-br from-secondary to-neutral">
    <div className="bg-neutral w-full flex flex-col justify-center bg-opacity-60 px-8 pt-12 pb-24 lg:pt-4 lg:pt-4">
      <h1 className="flex flex-row gap-2 items-center justify-between w-full max-w-lg mx-auto">
        <div className="w-14 text-secondary">
          <LogoSpinner />
        </div>
        <div className="text-4xl text-center text-neutral-content">Morio</div>
        <div className="w-14 text-secondary">
          <LogoSpinner />
        </div>
      </h1>
      <div className="max-w-lg text-center mx-auto text-neutral-content opacity-80 italic">
        One moment please
      </div>
    </div>
  </div>
)

const checkRole = (role = false, requiredRole = 'user') => {
  if (!role) return false
  if (roles.indexOf(role) >= roles.indexOf(requiredRole)) return true

  return false
}

export const AuthWrapper = ({ role = 'user', account, setAccount, children }) => {
  const [user, setUser] = useState(false)

  /*
   * Avoid hydration errros
   */
  useEffect(() => {
    if (!user) setUser(true)
  }, [user])

  /*
   * If no role is specified, we default to user.
   * But if role is explictly passed as false, it means authentication is not
   * needed, or even wanted. This is true for things like login pages, and the
   * initial setup.
   */
  if (role === false) return children

  /*
   * This will render server-side, so it will also render
   * client-side. This will flash very briefly which feels
   * unpolished. So we actually delay client-side rendering
   * because it feels more polished when there's a very
   * brief loading screen rather than a mere flash
   */
  if (!user) return <OneMomentPlease />

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
  if (checkRole(account.role, role)) return children

  /*
   * If the user is logged in but does not have the required role, show warning
   */
  return (
    <AuthLayout>
      <Login {...{ setAccount, account, role }} />
    </AuthLayout>
  )
}
