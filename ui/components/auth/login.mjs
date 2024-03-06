// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useContext, useState } from 'react'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { Tabs, Tab } from 'components/tabs.mjs'
import { PasswordInput } from '../inputs.mjs'
import { Popout } from 'components/popout.mjs'
// Providers
import { MrtProvider } from './mrt-provider.mjs'

export const Login = ({ setAccount, account = false, role = false }) => {
  const [error, setError] = useState(false)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Back wrapper to check for History (only available in browser)
   */
  const back = () => {
    if (history) history.back()
  }

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Props shared by each provider
   */
  const providerProps = { api, setAccount, setLoadingStatus, setError }

  return (
    <div className="w-full max-w-2xl m-auto bg-base-100 bg-opacity-60 rounded-lg shadow py-4 px-8 pb-2">
      <h2 className="">{account && role ? 'A different role is required' : 'Sign in to Morio'}</h2>
      {account && role ? (
        <>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th className="text-right w-28">Required&nbsp;Role</th>
                <th>Current&nbsp;Roles</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-right">
                  <span className="badge badge-error ml-1">{role}</span>
                </td>
                <td>
                  {account.roles.map((role) => (
                    <span className="badge badge-success ml-1" key={role}>
                      {role}
                    </span>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
          <br />
          <Popout note compact dense noP>
            You can assume a different role, or{' '}
            <a role="button" onClick={back}>
              go back
            </a>
            .
          </Popout>
        </>
      ) : null}
      <Tabs tabs="Root Token, other">
        <Tab tabId="Root Token">
          <MrtProvider {...providerProps} />
        </Tab>
        <Tab tabId="other">fixme: Handle other providers</Tab>
      </Tabs>
      {error ? (
        <Popout warning compact noP>
          {error}
        </Popout>
      ) : null}
    </div>
  )
}