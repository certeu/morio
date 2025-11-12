// Dependencies
import { shortDate, varify } from 'lib/utils.mjs'
// Hooks
import { useState, useContext, useEffect } from 'react'
import { useAccount } from 'hooks/use-account.mjs'
import { useApi } from 'hooks/use-api.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { Highlight } from 'components/highlight.mjs'
import {
  OidcIcon,
  PlusIcon,
  OkIcon,
  CloseIcon,
  ResetIcon,
  TrashIcon,
  FingerprintIcon,
  KeyIcon,
  RestartIcon,
  LogoutIcon,
} from 'components/icons.mjs'
import { DateAndTime, TimeToGo, TimeAgo } from 'components/time.mjs'
import { Role } from 'components/role.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { RoleInput, StringInput, FormControl } from 'components/inputs.mjs'
import { Popout } from 'components/popout.mjs'
import { DateTime } from 'luxon'
import { AccountStatus } from './accounts.mjs'
import { Label } from './label.mjs'

export const AccountOverview = () => {
  const { account } = useAccount()

  return account ? (
    <table className="table">
      <thead>
        <tr>
          <th className="w-36 text-right">Description</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="w-36 text-right font-bold">Username</td>
          <td>
            <span className="badge badge-primary">{account.user}</span>
          </td>
        </tr>
        <tr>
          <td className="w-36 text-right font-bold">Current role</td>
          <td>
            <Role role={account.role} />
          </td>
        </tr>
        {account.highest_role ? (
          <tr>
            <td className="w-36 text-right font-bold">Maximum role</td>
            <td>
              <Role role={account.highest_role} />
            </td>
          </tr>
        ) : null}
        {account.available_roles ? (
          <tr>
            <td className="w-36 text-right font-bold">Available roles</td>
            <td className="flex flex-row items-center gap-1">
              {account.available_roles.map((role) => (
                <Role key={role} role={role} />
              ))}
            </td>
          </tr>
        ) : null}
        <tr>
          <td className="w-36 text-right font-bold">Identity Provider</td>
          <td>
            <span className="badge badge-neutral">{account.provider}</span>
          </td>
        </tr>
        <tr>
          <td className="w-36 text-right font-bold">Labels</td>
          <td className="flex flex-row flex-wrap gap-1">
            {(account.labels || []).map((label) => (
              <Label key={label}>{label}</Label>
            ))}
          </td>
        </tr>
        <tr>
          <td className="w-36 text-right font-bold">Session</td>
          <td>
            Your session will expire in{' '}
            <b>
              <TimeToGo iso={new Date(account.exp * 1000).toISOString()} />
            </b>
          </td>
        </tr>
      </tbody>
    </table>
  ) : null
}

export const AccountToken = () => {
  const { account } = useAccount()

  return <Highlight js={account} title="JSON Web Token" />
}

export const LogoutButton = () => {
  const { logout } = useAccount()

  return (
    <button className="btn btn-neutral flex flex-row justify-between gap-4" onClick={logout}>
      <LogoutIcon /> Logout
    </button>
  )
}

export const ShowTokenButton = () => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary btn-outline flex flex-row justify-between gap-4"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick>
            <AccountToken />
          </ModalWrapper>
        )
      }
    >
      <FingerprintIcon /> Show Token
    </button>
  )
}

export const RenewTokenButton = () => {
  const { renewToken } = useAccount()

  return (
    <button className="btn btn-primary flex flex-row justify-between gap-4" onClick={renewToken}>
      <RestartIcon />
      <span className="pl-4"> Renew Token</span>
    </button>
  )
}

const NoKeysForYou = ({ provider }) => (
  <Popout note>
    <h5>
      The <code>{provider}</code> identity provider does not allow creating API keys
    </h5>
    <p>
      To create an API key, authenticate using a provider that is not the <code>mrt</code> or{' '}
      <code>apikey</code> provider as they do not allow creating API keys.
    </p>
  </Popout>
)

export const NewApiKeyButton = () => {
  const { pushModal } = useContext(ModalContext)
  const { provider } = useAccount()

  return ['mrt', 'apikey'].includes(provider) ? (
    <NoKeysForYou provider={provider} />
  ) : (
    <button
      className="btn btn-primary"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick>
            <AddApiKey />
          </ModalWrapper>
        )
      }
    >
      <KeyIcon />
      <span className="pl-4"> New API Key</span>
    </button>
  )
}

/**
 * React component to add an API key. Typically loaded in a modal.
 */
export const AddApiKey = () => {
  const [role, setRole] = useState('user')
  const [days, setDays] = useState(1)
  const [name, setName] = useState('')
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)
  const { account } = useAccount()

  const createApiKey = async () => {
    setLoadingStatus([true, 'Creating API Key'])
    const result = await api.createApikey({ role, expires: days, name })

    if (result[1] === 200) {
      setLoadingStatus([true, 'API Key Created', true, true])
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <ShowNewApiKey data={result[0]} />
        </ModalWrapper>
      )
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to create API key`,
        true,
        false,
      ])
  }

  return (
    <>
      <h2>Create a new API key</h2>
      <StringInput
        label="Key Name"
        labelBL="A descriptive name for this API key helps remembering its purpose"
        current={name}
        update={setName}
        valid={(val) => (val.length > 2 ? true : false)}
      />
      <ExpiryPicker {...{ days, setDays }} />
      <RoleInput
        {...{ role, setRole }}
        maxRole={account.role}
        label="Key Role"
        labelBL="Limit the permissions of the API key to what is strictly required"
      />
      <button
        className="btn btn-primary w-full mt-4"
        onClick={createApiKey}
        disabled={name.length < 2}
      >
        Create API Key
      </button>
    </>
  )
}

const ShowNewApiKey = ({ data }) => (
  <div className="max-w-2xl">
    <h2> API Key Created</h2>
    <p>
      This API key holds the <Role role={data.role} /> role and expires{' '}
      <b>
        <DateAndTime iso={data.expires_at} /> (<TimeToGo iso={data.expires_at} />)
      </b>{' '}
      from now.
    </p>
    <Highlight title="Key">{data.id}</Highlight>
    <Highlight title="Secret">{data.secret}</Highlight>
    <p>
      Use the <b>key</b> as <b>username</b> and the <b>secret</b> as <b>password</b> to authenticate
      with this key.
    </p>
    <Popout important>
      <h5>Store the secret in a safe place</h5>
      <p>
        This is <b>the only time</b> you get to see the secret. So make sure to copy it.
      </p>
    </Popout>
  </div>
)

const ShowRotatedApiKey = ({ data }) => (
  <div className="max-w-2xl">
    <h2> API Key Rotated</h2>
    <p>
      The new secret for key <code>{data.key.slice(0, 8)}</code> is shown below:
    </p>
    <Highlight title="Secret">{data.secret}</Highlight>
    <Popout important>
      <h5>Store the secret in a safe place</h5>
      <p>
        This is <b>the only time</b> you get to see the secret. So make sure to copy it.
      </p>
    </Popout>
  </div>
)

const ExpiryPicker = ({ days, setDays }) => {
  const [expires, setExpires] = useState()

  // Run update when component mounts
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => update(days), [])

  const update = (evt) => {
    const value = typeof evt === 'number' ? evt : evt.target.value
    setExpires(DateTime.now().plus({ days: value }))
    setDays(value)
  }

  return (
    <FormControl
      label="Key Lifetime"
      labelTR={`${days} ${days < 2 ? 'day' : 'days'}`}
      labelBL={`Key expires on: ${shortDate(expires)}`}
    >
      <input
        type="range"
        min="0"
        max={730}
        value={days}
        className="range range-primary"
        onChange={update}
      />
    </FormControl>
  )
}

export const Apikey = ({ data }) => (
  <div className="grid grid-cols-6">
    <code>{data.key.slice(0, 8)}</code>
    <AccountStatus status={data.status} />
    <b>{data.createdBy}</b>
    <Role role={data.role} />
    <span>
      <b>
        <TimeAgo time={data.created_at} />
      </b>
    </span>
    <span>
      <b>
        <DateAndTime iso={data.expires_at} />
        <TimeToGo iso={data.expires_at} />
      </b>{' '}
      from now
    </span>
  </div>
)

export const AccountApiKeys = () => {
  const [keys, setKeys] = useState()
  const [refresher, setRefresher] = useState(0)
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)

  useEffect(() => {
    const getApikeys = async () => {
      const result = await api.getApikeys()
      if (result[1] === 200) setKeys(result[0])
    }
    getApikeys()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresher])

  const refresh = () => setRefresher(refresher + 1)

  if (!keys || keys.length < 1) return null

  return (
    <table className="mdx table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Name</th>
          <th>Status</th>
          <th>Role</th>
          <th>Created</th>
          <th>Expires</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody className="nostripes">
        {keys.map((data) => (
          <tr
            key={data.key}
            className="hover:cursor-pointer hover:bg-primary hover:bg-opacity-20"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick>
                  <EditApikey data={data} refresh={refresh} />
                </ModalWrapper>
              )
            }
          >
            <td>
              <code>{data.key.slice(0, 8)}</code>
            </td>
            <td>
              <b>{data.name}</b>
            </td>
            <td>
              <AccountStatus status={data.status} />
            </td>
            <td>
              <Role role={data.role} />
            </td>
            <td>
              <span>
                <b>
                  <TimeAgo iso={data.created_at} />
                  <br />
                  <small>
                    <DateAndTime iso={data.created_at} />
                  </small>
                </b>
              </span>
            </td>
            <td>
              <span>
                <b>
                  <TimeToGo iso={data.expires_at} />
                  <br />
                  <small>
                    <DateAndTime iso={data.expires_at} />
                  </small>
                </b>
              </span>
            </td>
            <td>
              <b>{data.createdBy}</b>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const EditApikey = ({ data, refresh }) => {
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { clearModal, pushModal } = useContext(ModalContext)

  const updateApikey = async (action) => {
    const del = action === 'delete' ? true : false
    setLoadingStatus([true, 'Updating API Key'])
    const result = del ? await api.removeApikey(data.key) : await api.updateApikey(data.key, action)
    if (result[1] === 200 || (del && result[1] === 204)) {
      refresh()
      setLoadingStatus([true, `API Key ${del ? 'Removed' : 'Updated'}`, true, true])
      if (action === 'rotate')
        pushModal(
          <ModalWrapper keepOpenOnClick>
            <ShowRotatedApiKey data={result[0]} />
          </ModalWrapper>
        )
      else clearModal()
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to update API key`,
        true,
        false,
      ])
  }

  return (
    <div className="max-w-2xl">
      <h2>API Key {data.key.slice(0, 8)}</h2>
      <Highlight title="Key">{data.key}</Highlight>
      <div className="grid grid-cols-3 gap-2">
        <button className="btn btn-primary bnt-outline" onClick={() => updateApikey('rotate')}>
          <div className="flex flex-row gap-2 items-center justify-between w-full">
            <ResetIcon />
            Rotate Key Secret
          </div>
        </button>
        {data.status === 'disabled' ? (
          <button className="btn btn-success bnt-outline" onClick={() => updateApikey('enable')}>
            <div className="flex flex-row gap-2 items-center justify-between w-full">
              <OkIcon stroke={3} />
              Enable API Key
            </div>
          </button>
        ) : (
          <button className="btn btn-warning bnt-outline" onClick={() => updateApikey('disable')}>
            <div className="flex flex-row gap-2 items-center justify-between w-full">
              <CloseIcon />
              Disable API Key
            </div>
          </button>
        )}
        <button className="btn btn-error bnt-outline" onClick={() => updateApikey('delete')}>
          <div className="flex flex-row gap-2 items-center justify-between w-full">
            <TrashIcon />
            Remove API Key
          </div>
        </button>
      </div>
    </div>
  )
}

export const AccountOidcClients = () => {
  const [clients, setClients] = useState()
  const [refresher, setRefresher] = useState(0)
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)

  useEffect(() => {
    const getOidcClients = async () => {
      const result = await api.getOidcClients()
      if (result[1] === 200 && result[0]?.oidc_clients) setClients(result[0].oidc_clients)
    }
    getOidcClients()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresher])

  const refresh = () => setRefresher(refresher + 1)

  if (!clients || clients.length < 1) return null

  return (
    <>
      <table className="mdx table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>By</th>
            <th>Owner</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody className="nostripes">
          {Object.keys(clients)
            .sort()
            .map((id) => {
              const data = clients[id]
              return (
                <tr
                  key={data.key}
                  className="hover:cursor-pointer hover:bg-primary hover:bg-opacity-20"
                  onClick={() =>
                    pushModal(
                      <ModalWrapper keepOpenOnClick>
                        <EditOidcClient data={data} refresh={refresh} />
                      </ModalWrapper>
                    )
                  }
                >
                  <td>
                    <code>{data.id}</code>
                  </td>
                  <td>
                    <b>{data.name}</b>
                  </td>
                  <td>
                    <b>{data.by}</b>
                  </td>
                  <td>
                    <b>{data.createdBy}</b>
                  </td>
                  <td>
                    <span>
                      <b>
                        <TimeAgo iso={data.created_at} />
                        <br />
                        <small>
                          <DateAndTime iso={data.created_at} />
                        </small>
                      </b>
                    </span>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
      <p className="text-right">
        <NewOidcClientButton refresh={refresh} />
      </p>
    </>
  )
}

/**
 * React component to add an OIDC client. Typically loaded in a modal.
 */
export const AddOidcClient = ({ refresh }) => {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [by, setBy] = useState('')
  const [uris, setUris] = useState([''])
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  const createOidcClient = async () => {
    setLoadingStatus([true, 'Creating OIDC client'])
    const result = await api.createOidcClient({ id, name, by, uris })

    if (result[1] === 200) {
      setLoadingStatus([true, 'OIDC client created', true, true])
      if (typeof refresh === 'function') refresh()
      clearModal()
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to create OIDC client`,
        true,
        false,
      ])
  }

  return (
    <>
      <h2>Create a new OIDC client</h2>
      <StringInput
        label="Client ID"
        labelBL="A unique ID to identity the client"
        placeholder="pizza"
        current={id}
        update={(val) => setId(varify(val))}
        valid={(val) => (val.length > 2 ? true : false)}
      />
      <ClientInputs {...{ uris, setUris, name, setName, by, setBy }} />
      <button
        className="btn btn-primary w-full mt-4"
        onClick={createOidcClient}
        disabled={name.length < 2}
      >
        Create OIDC Client
      </button>
    </>
  )
}

const ClientInputs = ({ uris, setUris, name, setName, by, setBy }) => {
  /*
   * Update method for the uris array
   */
  const updateUri = (val, i) => {
    const newUris = [...uris]
    newUris[i] = val
    setUris(newUris)
  }

  /*
   * Removes a uri from the uris array
   */
  const removeUri = (i) => {
    const newUris = uris.slice(0, i).concat(uris.slice(i + 1))
    setUris(newUris)
  }

  /*
   * Adds a URI to the uris array
   */
  const addUri = () => {
    const newUris = [...uris, '']
    setUris(newUris)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StringInput
          label="Name"
          labelBL="Application name for the consent screen"
          placeholder="Pizza Vending Machine"
          current={name}
          update={setName}
          valid={(val) => (val.length > 2 ? true : false)}
        />
        <StringInput
          label="By"
          labelBL="Developer/Company name for the consent screen"
          placeholder="Boxo Co"
          current={by}
          update={setBy}
          valid={(val) => (val.length > 2 ? true : false)}
        />
      </div>
      {uris.map((uri, i) => (
        <div className="flex flex-row gap-2 items-start" key={i}>
          <StringInput
            placeholder="https://pizza.morio.it/oidc/callback"
            label={`Callback URL #${i}`}
            labelBL="An allowed callback URL for this client"
            valid={() => true}
            current={uris[i]}
            update={(val) => updateUri(val, i)}
          />
          <button className="btn btn-error btn-outline mt-9" onClick={() => removeUri(i)}>
            <TrashIcon />
          </button>
        </div>
      ))}
      <p className="text-right">
        <button className="btn btn-success btn-sm" onClick={() => addUri()}>
          <PlusIcon className="w-4 h-4" stroke={4} /> Add Callback URL
        </button>
      </p>
    </>
  )
}
export const NewOidcClientButton = ({ refresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick>
            <AddOidcClient refresh={refresh} />
          </ModalWrapper>
        )
      }
    >
      <OidcIcon />
      <span className="pl-4"> New OIDC Client</span>
    </button>
  )
}

export const EditOidcClient = ({ data, refresh }) => {
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { clearModal } = useContext(ModalContext)
  const [name, setName] = useState(data.name)
  const [by, setBy] = useState(data.by)
  const [uris, setUris] = useState(data.redirect_uris)

  const update = async () => {
    setLoadingStatus([true, 'Updating OIDC Client'])
    const result = await api.updateOidcClient(data.id, { name, by, uris })
    if (result[1] === 200) {
      refresh()
      setLoadingStatus([true, `OIDC client updated`, true, true])
      clearModal()
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to update OIDC client`,
        true,
        false,
      ])
  }
  const remove = async () => {
    setLoadingStatus([true, 'Removing OIDC Client'])
    const result = await api.removeOidcClient(data.id)
    if (result[1] === 204) {
      refresh()
      setLoadingStatus([true, `OIDC client removed`, true, true])
      clearModal()
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to remove OIDC client`,
        true,
        false,
      ])
  }

  return (
    <div className="max-w-2xl">
      <h2>OIDC Client {data.id}</h2>
      <ClientInputs {...{ uris, setUris, name, setName, by, setBy }} />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-error btn-outline" onClick={remove}>
          <div className="flex flex-row gap-2 items-center justify-between w-full">
            <TrashIcon />
            Remove OIDC Client
          </div>
        </button>
        <button className="btn btn-primary" onClick={update}>
          <div className="flex flex-row gap-2 items-center justify-between w-full">
            <OkIcon stroke={3} />
            Update OIDC Client
          </div>
        </button>
      </div>
    </div>
  )
}
