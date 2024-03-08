import { roles } from 'config/roles.mjs'
// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useContext, useState } from 'react'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { PasswordInput } from '../inputs.mjs'
import { Popout } from 'components/popout.mjs'
import { Term } from 'components/term.mjs'
import { ListInput } from '../inputs.mjs'
import { QuestionIcon } from 'components/icons.mjs'
// Providers
import { MrtProvider } from './mrt-provider.mjs'
import { LdapProvider } from './ldap-provider.mjs'

const providers = {
  mrt: MrtProvider,
  ldap: LdapProvider,
}

const UnknownIdp = ({ label }) => (
  <Popout error>
    <p>
      The Identity Provider <b>{label}</b> lacks a login form configuration.
    </p>
  </Popout>
)

const help = (
  <Tab key="thelp">
    <h3>Not certain how to authenticate?</h3>
    <p>
      Morio supports a variety of identity providers. Each tab lists one of them.
      <br />
      With the exception of the <b>Root Token</b> provider, they are set up by the local Morio
      operator (<Term>LoMO</Term>).
    </p>
    <p>
      Contact your <Term>LoMO</Term> for questions about how to authenticate to this Morio
      deployment.
    </p>
  </Tab>
)

export const Login = ({ setAccount, account = false, role = false }) => {
  const [error, setError] = useState(false)
  const [idps, setIdps] = useState({})

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Load available identity providers from API
   */
  useEffect(() => {
    const getIdps = async () => {
      const [result, status] = await api.getIdps()
      if (status === 200 && result.idps) setIdps(result.idps)
    }
    getIdps()
  }, [])

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
   * Props shared by each idp
   */
  const providerProps = { api, setAccount, setLoadingStatus, setError }

  /*
   * Helper to get the tablist, and array of tabs with IDPs
   */
  const tabList =
    Object.keys(idps).length > 0
      ? String(Object.keys(idps).sort().join(',')) + ', Not Sure?'
      : false
  const tabs = tabList
    ? [
        ...Object.keys(idps)
          .sort()
          .map((label) => {
            const Idp = providers[idps[label].provider] || UnknownIdp
            return (
              <Tab key={label}>
                <Idp {...idps[label]} label={label} {...providerProps} />
              </Tab>
            )
          }),
        help,
      ]
    : []

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
                  {account.roles &&
                    account.roles.map((role) => (
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
            You can{' '}
            <a role="button" onClick={back}>
              go back
            </a>
            , or{' '}
            <a role="button" onClick={() => setAccount(null)}>
              log out
            </a>{' '}
            to assume a different role.
          </Popout>
        </>
      ) : null}
      {tabList ? (
        <Tabs
          tabs={tabList}
          children={[
            ...tabs,
            <Tab tabI="Not Sure?" key="help">
              <h3>Not certain how to authenticate?</h3>
              <p>
                Morio supports a variety of identity providers. Each tab lists one of them.
                <br />
                With the exception of the <b>Root Token</b> provider, they are set up by the local
                Morio operator (<Term>LoMO</Term>).
              </p>
              <p>
                Contact your <Term>LoMO</Term> for questions about how to authenticate to this Morio
                deployment.
              </p>
            </Tab>,
          ]}
        />
      ) : (
        <p>nope</p>
      )}
      {error ? (
        <Popout warning compact noP>
          {error}
        </Popout>
      ) : null}
    </div>
  )
}

export const RoleInput = ({ role, setRole }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <ListInput
      label="Role"
      dense
      dir="row"
      update={(val) => (role === val ? setRole(false) : setRole(val))}
      current={role}
      list={roles.map((role) => ({ val: role, label: role }))}
      dflt="user"
    />
  )
}
