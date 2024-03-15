// Dependencies
import { roles } from 'config/roles.mjs'
import { shortDate } from 'lib/utils.mjs'
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
  OkIcon,
  CloseIcon,
  ResetIcon,
  TrashIcon,
  WarningIcon,
  FingerprintIcon,
  KeyIcon,
  RestartIcon,
  LogoutIcon,
} from 'components/icons.mjs'
import { TimeToGo, MsAgo } from 'components/time-ago.mjs'
import { Role } from 'components/role.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { RoleInput, StringInput, FormControl } from 'components/inputs.mjs'
import { Popout } from 'components/popout.mjs'
import { DateTime } from 'luxon'
import { AccountStatus } from './accounts.mjs'

export const AccountOverview = () => {
  const { account } = useAccount()

  const level = roles.indexOf(account.role)
  const maxLevel = roles.indexOf(account.maxRole)

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
        <tr>
          <td className="w-36 text-right font-bold">Maximum role</td>
          <td>
            <Role role={account.maxRole} />
          </td>
        </tr>
        <tr>
          <td className="w-36 text-right font-bold">Identity Provider</td>
          <td>
            <span className="badge badge-neutral">{account.provider}</span>
          </td>
        </tr>
        <tr>
          <td className="w-36 text-right font-bold">Session</td>
          <td>
            Your session will expire in{' '}
            <b>
              <TimeToGo time={account.exp} />
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
  const { account } = useAccount()

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
  const { logout, renewToken } = useAccount()

  return (
    <button className="btn btn-primary flex flex-row justify-between gap-4" onClick={renewToken}>
      <RestartIcon />
      <span className="pl-4"> Renew Token</span>
    </button>
  )
}

const NoKeysForYou = ({ provider }) => (
  <button className="btn btn-error" isabled>
    <div className="flex flex-row gap-1">
      <WarningIcon />
      <span>This identity provider does not allow creating API keys</span>
    </div>
  </button>
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
          <ShowNewApiKey data={result[0].data} />
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
        <TimeToGo time={data.expiresAt / 1000} />
      </b>{' '}
      from now.
    </p>
    <Highlight title="Key">{data.key}</Highlight>
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
        <MsAgo time={data.createdAt} />
      </b>
    </span>
    <span>
      <b>
        <TimeToGo time={data.expiresAt / 1000} />
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
      if (result[1] === 200) setKeys(result[0].keys)
    }
    getApikeys()
  }, [refresher])

  const refresh = () => setRefresher(refresher + 1)

  return (
    <table className="mdx table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Name</th>
          <th>Status</th>
          <th>Role</th>
          <th>Created At</th>
          <th>Expires At</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody className="nostripes">
        {keys &&
          keys.map((data) => (
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
              <td>{data.name}</td>
              <td>
                <AccountStatus status={data.status} />
              </td>
              <td>
                <Role role={data.role} />
              </td>
              <td>
                <span>
                  <b>
                    <MsAgo time={data.createdAt} />
                  </b>
                </span>
              </td>
              <td>
                <span>
                  <b>
                    <TimeToGo time={data.expiresAt / 1000} />
                  </b>{' '}
                  from now
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
            <ShowRotatedApiKey data={result[0].data} />
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
