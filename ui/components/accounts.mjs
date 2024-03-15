import orderBy from 'lodash.orderby'
import { roles } from 'config/roles.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useAccount } from 'hooks/use-account.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { PlayIcon } from 'components/icons.mjs'
import { MsAgo } from 'components/time-ago.mjs'
import { LogoSpinner } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import { StringInput, TextInput, SecretInput, RoleInput } from 'components/inputs.mjs'
import { Highlight } from 'components/highlight.mjs'
import { PageLink } from 'components/link.mjs'
import { Role } from 'components/role.mjs'

/**
 * React component to display the accounts
 */
export const ListAccounts = () => {
  const [accounts, setAccounts] = useState(false)
  const [provider, setProvider] = useState(false)
  const [order, setOrder] = useState('lastLogin')
  const [reverse, setReverse] = useState(false)
  const { pushModal } = useContext(ModalContext)

  const { api } = useApi()

  useEffect(() => {
    const loadAccounts = async () => {
      const result = await api.getAccounts()
      if (result[1] === 200 && result[0]) setAccounts(result[0])
    }
    loadAccounts()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  const changeOrder = (key) => {
    if (order === key) setReverse(!reverse)
    else setOrder(key)
  }
  const changeProvider = (key) => {
    if (provider === key) setProvider(false)
    else setProvider(key)
  }

  return accounts ? (
    <table className="table">
      <thead>
        <tr>
          {['provider', 'username', 'lastLogin', 'status'].map((key) => (
            <th key={key}>
              <button
                onClick={() => changeOrder(key)}
                className="btn btn-ghost btn-sm capitalize w-full flex flex-row gap-2 justify-start"
              >
                {key === 'lastLogin' ? 'Last Login' : key}
                {provider && key === 'provider' ? <span className="">[{provider}]</span> : null}
                {order === key ? (
                  <PlayIcon fill className={`w-5 h-5 ${reverse ? 'rotate-90' : '-rotate-90'}`} />
                ) : null}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="nostripes">
        {orderBy(
          accounts.filter((acc) => (provider ? acc.provider === provider : true)),
          [order],
          [reverse ? 'desc' : 'asc']
        ).map((acc) => (
          <tr
            key={acc.id}
            className="hover:bg-primary hover:cursor-pointer hover:bg-opacity-20"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick>
                  <AccountDetail account={acc} />
                </ModalWrapper>
              )
            }
          >
            <td>
              <button className="btn btn-ghost btn-sm" onClick={() => changeProvider(acc.provider)}>
                {acc.provider}
              </button>
            </td>
            <td>{acc.username}</td>
            <td>
              {acc.lastLogin ? (
                <MsAgo time={acc.lastLogin} />
              ) : (
                <em className="opacity-60">never</em>
              )}
            </td>
            <td>
              <AccountStatus status={acc.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="w-24">
      <LogoSpinner />
    </div>
  )
}

const AccountDetail = ({ account }) => (
  <div className="w-2xl w-full">
    <h2>{account.id}</h2>
    <Highlight js={account} title="Account Data" />
  </div>
)

const statusColors = {
  active: 'success',
  blocked: 'error',
  pending: 'warning',
  unknown: 'neutral',
  disabled: 'warning',
  deleted: 'error',
}

export const AccountStatus = ({ status = 'unknown' }) => (
  <div className={`badge badge-${statusColors[status]}`}>{status}</div>
)

export const AddLocalAccount = () => {
  const [local, setLocal] = useState(false)
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)

  useEffect(() => {
    const loadIdps = async () => {
      const result = await api.getIdps()
      if (result[1] === 200 && result[0]) {
        for (const id in result[0].idps) {
          if (result[0].idps[id].provider === 'local') setLocal(true)
        }
      }
    }
    loadIdps()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  if (!local) return null

  return (
    <Popout note>
      <h5 className="flex flex-row gap-2 items-center w-full mb-4">
        <span className="grow">Local Morio Accounts are enabled</span>
        <button
          className="btn btn-neutral"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick>
                <AddLocalAccountModal />
              </ModalWrapper>
            )
          }
        >
          Add local account
        </button>
      </h5>
      <p>
        Even though the local identity provider is enabled,{' '}
        <b>it does not allow users to register or self-enroll</b>.
        <br />
        Instead, we will generate an invite link after creating the account.
      </p>
    </Popout>
  )
}

const OverwriteExistingAccount = ({ createAccount }) => {
  const { popModal } = useContext(ModalContext)
  const { role } = useAccount()

  return (
    <div className="max-w-3xl w-full">
      <h2>This account already exists</h2>
      {['operator', 'engineer', 'root'].includes(role) ? (
        <>
          <p>
            Since your role is <Role role={role} /> you can overwrite the account if you choose to.
          </p>
          <Popout warning>
            <h5>Replace this account?</h5>
            <p>We can overwrite the account, but there is no way back from this.</p>
            <p className="text-center">
              <button className="btn btn-error" onClick={() => createAccount(true)}>
                Overwrite Account
              </button>
            </p>
          </Popout>
        </>
      ) : (
        <>
          <p>
            With your current <Role role={role} /> role, you cannot overwrite the account.
          </p>
          <p className="text-center">
            <button className="btn btn-primary" onClick={popModal}>
              Back
            </button>
          </p>
        </>
      )}
    </div>
  )
}

const AddLocalAccountModal = () => {
  const [username, setUsername] = useState('')
  const [about, setAbout] = useState('')
  const [userRole, setUserRole] = useState('user')
  const { api } = useApi()
  const { role } = useAccount()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { pushModal, popModal } = useContext(ModalContext)

  const createAccount = async (overwrite = false) => {
    setLoadingStatus([true, 'Contacting the Morio API'])
    const result = await api.createAccount({
      username,
      about,
      provider: 'local',
      role: userRole,
      overwrite,
    })
    if (result[1] === 200 && result[0].data) {
      setLoadingStatus([true, 'Account created', true, true])
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <InviteResult data={result[0].data} />
        </ModalWrapper>
      )
    } else if (result[1] === 409) {
      /*
       * The account exists
       */
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <OverwriteExistingAccount createAccount={createAccount} />
        </ModalWrapper>
      )
    } else {
      return setLoadingStatus([true, `Unable to create account`, true, false])
    }
  }

  return (
    <div className="max-w-2xl w-full">
      <h2>Add Local Morio Account</h2>
      <StringInput
        label="Username"
        labelBL="The username for the account"
        current={username}
        update={setUsername}
      />
      <RoleInput label="Role" role={userRole} setRole={setUserRole} maxRole={role} />
      <TextInput
        label="About"
        labelBL="Optional: To help you remember why this account was created"
        current={about}
        update={setAbout}
      />
      <button
        onClick={() => createAccount()}
        className="btn btn-primary w-full"
        disabled={username.length < 1}
      >
        Create Account
      </button>
    </div>
  )
}

const InviteResult = ({ data }) => (
  <div className="max-w-3xl w-full">
    <h2>Local Morio Account Created</h2>
    <ul>
      <li>
        <b>Username</b>: {data.username}
      </li>
      <li>
        <b>Invite code</b>: <code>{data.invite}</code>
      </li>
    </ul>
    <Highlight title="Invite Link">{data.inviteUrl}</Highlight>
  </div>
)

export const ActivateAccount = ({ invite = '', user = '' }) => {
  const [inviteCode, setInviteCode] = useState(invite)
  const [username, setUsername] = useState(user)
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const [data, setData] = useState(false)
  const [mfa, setMfa] = useState('')
  const [password, setPassword] = useState('')
  const [scratchCodes, setScratchCodes] = useState(false)

  const activateAccount = async () => {
    setLoadingStatus([true, 'One moment please, contacting the Morio API'])
    const result = await api.activateAccount({ username, invite: inviteCode, provider: 'local' })
    if (result[1] === 200 && result[0].data) {
      setLoadingStatus([true, 'Account needs to be setup', true, true])
      setData(result[0].data)
    } else return setLoadingStatus([true, `Unable to activate account`, true, false])
  }

  const activateMfa = async () => {
    setLoadingStatus([true, 'One moment please, contacting the Morio API'])
    const result = await api.activateMfa({
      username,
      invite: inviteCode,
      provider: 'local',
      password,
      token: mfa,
    })
    if (result[1] === 200 && result[0].data) {
      setLoadingStatus([true, 'Account activated', true, true])
      setScratchCodes(result[0].data.scratchCodes)
    } else
      return setLoadingStatus([
        true,
        result[0].error ? result[0].error : `Unable to activate account`,
        true,
        false,
      ])
  }

  if (scratchCodes)
    return (
      <>
        <h2>Account activated</h2>
        <p>
          You can now <PageLink href="/account">login with your local Morio account</PageLink>{' '}
          (username: <b>{username}</b>).
        </p>
        <Popout important>
          <h5>Store these scratch codes in a save space</h5>
          <ul className="list list-inside list-disc ml-4">
            {scratchCodes.map((code, i) => (
              <li key={i}>{code}</li>
            ))}
          </ul>
          <p>
            Without access to your phone, you can still access Morio using one of these codes as
            one-time MFA token.
          </p>
        </Popout>
      </>
    )

  return data ? (
    <div className="">
      <div className="max-w-2xl mx-auto">
        <h2>Account Setup</h2>
        <p>Almost there, now choose a password and setup MFA on your phone.</p>
        <div className="grid grid-cols-2 gap-4">
          <div dangerouslySetInnerHTML={{ __html: data.qrcode }} className="max-w-sm mx-auto" />
          <div>
            <StringInput
              label="Password"
              current={password}
              update={setPassword}
              valid={(val) => (val.length > 6 ? true : { error: true })}
              labelBL="Choose a password for your account"
            />
            <StringInput
              label="MFA code"
              labelBL="Scan the QR code, then enter the MFA code here"
              current={mfa}
              update={setMfa}
              valid={(val) => (val.length > 4 ? true : { error: true })}
            />
            <p className="text-center">
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={activateMfa}
                disabled={mfa.length < 5}
              >
                Setup MFA
              </button>
            </p>
          </div>
        </div>
      </div>
      <Popout note>
        <h5>MFA is mandatory on local Morio accounts</h5>
        <p>For non-human access, use an API key instead.</p>
      </Popout>
    </div>
  ) : (
    <div className="">
      <StringInput
        label="Username"
        current={username}
        update={setUsername}
        valid={(val) => (val.length > 0 ? true : { error: true })}
      />
      <StringInput
        label="Invite Code"
        current={inviteCode}
        update={setInviteCode}
        valid={(val) => (val.length === 48 ? true : { error: true })}
      />
      <p className="text-center">
        <button
          className="btn btn-primary btn-lg"
          onClick={activateAccount}
          disabled={inviteCode.length !== 48 || username.length < 1}
        >
          Activate Account
        </button>
      </p>
    </div>
  )
}
