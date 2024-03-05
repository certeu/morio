import { useCookies } from 'react-cookie'
import { decodeJwt } from 'lib/utils.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { useContext } from 'react'

export const useAccount = () => {
  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Store authentication state in a cookie
   */
  const [cookies, setCookie] = useCookies(['morio'])

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Helper method to set the cookie
   */
  const setAccount = (val) =>
    setCookie('morio', val, {
      path: '/',
      maxAge: 3600, // FIXME: Make this longer
      secure: true,
      sameSite: 'Strict',
      httpOnly: false,
    })

  /*
   * Helper method to log out/end the session
   */
  const logout = () => setAccount(null)

  /*
   * Helper method to renew the token
   */
  const renewToken = async () => {
    setLoadingStatus([true, 'Attempting to renew token'])
    const result = await api.renewToken()
    if (result[1] === 200 && result[0].jwt) {
      setAccount(result[0].jwt)
      setLoadingStatus([true, 'Token renewed', true, true])
    } else setLoadingStatus([true, `Failed to renew token`, true, false])
  }

  /*
   * Decode the token in the cookie
   */
  const account = decodeJwt(cookies.morio)

  return { account, setAccount, logout, renewToken }
}
