// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Components
import { Tabs, Tab } from 'components/tabs.mjs'
import { Popout } from 'components/popout.mjs'
import { Term } from 'components/term.mjs'
import { CloseIcon, QuestionIcon, ClosedLockIcon, OpenLockIcon } from 'components/icons.mjs'
// Providers
import { BaseProvider } from './base-provider.mjs'
import { LocalProvider } from './local-provider.mjs'
import { MrtProvider } from './mrt-provider.mjs'
import { OidcProvider } from './oidc-provider.mjs'

/*
 * For now this goes here, but this is not DRY
 */
const redirectErrors = {
  'morio.api.oidc.discovery.failed': 'OIDC Discovery failed for this identity provider.',
  'morio.api.oidc.client.init.failed': 'Failed to initialise OIDC client.',
  'morio.api.oidc.userinfo.unavailable': 'User info not available from OIDC provider.',
  'morio.api.oidc.callback.mismatch': 'OIDC callback mismatch.',
  'morio.api.oidc.username.unmatched': 'Unable to match username to OIDC property.',
  'morio.api.account.role.unavailable': 'The requested role is not available to you.',
}

const providers = {
  ldap: BaseProvider,
  apikey: (props) => <BaseProvider {...props} usernameLabel="API Key" passwordLabel="API Secret" />,
  local: LocalProvider,
  mrt: MrtProvider,
  oidc: OidcProvider,
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

const filterTab = (id, ui, showAll) =>
  ui?.visibility?.[id] !== 'hidden' && (showAll || ui?.visibility?.[id] !== 'icon')

/**
 * Helper method to figure out the list of tabs and their order
 *
 * There's a few things to take into account:
 *   - The available IDPs
 *   - Their visibility setting (taking showAll into account)
 *   - Their order
 *
 * @param {object} idps - The IPDS as returned from the API
 * @param {object} ui - The UI settings as returned from the API
 * @param {boolean} showAll - Whether or not showAll is enabled
 * @return {array} list - The list of tabs, in the correct order
 */
const tabOrder = (idps, ui, showAll) => {
  const order = []
  if (ui.order) order.push(...ui.order.filter((id) => filterTab(id, ui, showAll)))

  /*
   * Add any missing services
   */
  order.push(...Object.keys(idps).filter((id) => !order.includes(id) && filterTab(id, ui, showAll)))

  return order
}

export const Login = ({ setAccount, account = false, role = false }) => {
  const [error, setError] = useState(false)
  const [idps, setIdps] = useState(false)
  const [ui, setUi] = useState({})
  const [showAll, setShowAll] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { clearModal } = useContext(ModalContext)
  const router = useRouter()
  const { error: redirectError = false } = router.query

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

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
      if (status === 200 && result.idps) {
        setIdps(result.idps)
        setUi(result.ui)
        /*
         * Force closing modal windows and loading status when the login form initially loads
         * unless there's a redirect error
         */
        setLoadingStatus([false])
        clearModal()
      }
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
   * Props shared by each idp
   */
  const providerProps = { api, setAccount, setLoadingStatus, setError }

  /*
   * Helper to get the tablist, and array of tabs with IDPs
   */
  const tabList = tabOrder(idps, ui, showAll).filter(id => typeof idps[id] !== 'undefined')

  const tabs = tabList.map((id) => {
    const Idp = providers[idps[id].provider] || UnknownIdp
    return (
      <Tab key={id}>
        <Idp {...idps[id]} label={idps[id].label} {...providerProps} />
      </Tab>
    )
  })
  if (tabs.length > 0 && !showAll) tabs.push(help)

  /*
   * Helper var to indicate only the root token is available for authentication
   */
  const onlyMrt = Object.keys(idps).length < 1

  return (
    <div className="w-full max-w-2xl m-auto bg-base-100 bg-opacity-60 rounded-lg shadow py-4 px-8 pb-2">
      <h2 className="flex flex-row w-full items-center justify-between gap-2">
        {account && role ? 'A different role is required' : 'Sign in to Morio'}
        <div className="flex flex-row gap-2 items-center">
          <button onClick={() => setShowHelp(!showHelp)} title="Not sure what to do?">
            <QuestionIcon className="text-primary hover:text-accent h-8 w-8" />
          </button>
          {onlyMrt ? null : (
            <button
              onClick={() => {
                setShowHelp(false)
                setShowAll(!showAll)
              }}
              title="Allow Root Token logins"
            >
              {showAll ? (
                <OpenLockIcon className="text-warning hover:text-success h-8 w-8" />
              ) : (
                <ClosedLockIcon className="text-success hover:text-warning h-8 w-8" />
              )}
            </button>
          )}
        </div>
      </h2>
      {account && role ? (
        <>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th className="text-right w-28">Required&nbsp;Role</th>
                <th>Current&nbsp;Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-right">
                  <span className="badge badge-error ml-1">{role}</span>
                </td>
                <td>
                  <span className="badge badge-success ml-1">
                    {account.role}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <br />
          <Popout note compact dense noP>
            You can sign in again to assume a different role, or <a role="button" onClick={back}>go back</a>
          </Popout>
        </>
      ) : null}
      {showHelp ? (
        onlyMrt ? (
          <>
            <h3>Not certain how to authenticate?</h3>
            <p>
              This Morio does not (yet) have any authentication backends, or{' '}
              <b>identity providers</b>, configured.
            </p>
            <p>
              As a result, only the <b>Morio Root Token</b> can be used to sign in to this Morio
              instance.
            </p>
          </>
        ) : (
          <>
            <h3>Not certain how to authenticate?</h3>
            <p>
              Morio supports a variety of authentication backends, or <b>identity providers</b>.
            </p>
            <h4>Identity Providers</h4>
            <p>This Morio instance is set up with the following providers:</p>
            <ul className="list list-inside list-disc ml-4">
              {tabList.map((id) => (
                <li key={id}>
                  <b>{idps[id].label || id}</b>
                  {idps[id].about ? (
                    <span>
                      : <em>{idps[id].about}</em>
                    </span>
                  ) : (
                    ''
                  )}
                </li>
              ))}
            </ul>
            <p>
              Contact your Morio administrator for questions about how to authenticate to Morio.
            </p>
            {!showAll && tabList.length < Object.keys(idps).length ? (
              <Popout note>
                <h5>Advanced Identity Providers</h5>
                <p>
                  In addition to the providers above, the following providers are avaialable for
                  advanced use cases:
                </p>
                <ul className="list list-inside list-disc ml-4">
                  {Object.keys(idps)
                    .filter((id) => !tabList.includes(id))
                    .map((id) => (
                      <li key={id}>
                        <b>{idps[id].label || id}</b>
                      </li>
                    ))}
                </ul>
                <p>
                  To access them, click the{' '}
                  <ClosedLockIcon className="inline w-6 h-6 text-success" /> icon in the top-right
                  corner.
                </p>
              </Popout>
            ) : null}
            <button
              className="btn btn-neutral flex flex-row items-center gap-4 mx-auto mb-4"
              onClick={() => setShowHelp(false)}
            >
              <CloseIcon /> Close this help
            </button>
          </>
        )
      ) : tabList.length > 0 ? (
        <Tabs tabs={tabList.map((id) => idps[id].label || id)}>{tabs}</Tabs>
      ) : idps === false ? (
        <Popout warning>Could not load identity providers from the API</Popout>
      ) : (
        <Popout note>No identity providers are currently configured</Popout>
      )}
      {onlyMrt ? <MrtProvider label="Morio Root Token" {...providerProps} /> : null}
      {error ? (
        <Popout warning compact noP>
          {error}
        </Popout>
      ) : null}
      {redirectError ? (
        <Popout warning noP>
          <h5>An error occured</h5>
          {redirectErrors[redirectError] || redirectError}
        </Popout>
      ) : null}
    </div>
  )
}
