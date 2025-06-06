import orderBy from 'lodash/orderBy.js'
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
import { TimeForHumans } from 'components/time.mjs'
import { Spinner } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import { SecretInput, StringInput, TextInput, RoleInput } from 'components/inputs.mjs'
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
  const [searchTerm, setSearchTerm] = useState('')
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

  const refreshAccounts = async () => {
    const result = await api.getAccounts()
    if (result[1] === 200 && result[0]) setAccounts(result[0])
  }

  const filteredAccounts = accounts
    ? accounts.filter((acc) => {
        const matchesProvider = provider ? acc.provider === provider : true
        const matchesSearch = searchTerm
          ? acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (acc.about && acc.about.toLowerCase().includes(searchTerm.toLowerCase())) ||
            acc.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.status.toLowerCase().includes(searchTerm.toLowerCase())
          : true
        return matchesProvider && matchesSearch
      })
    : []

  return accounts ? (
    <div>
      <div className="mb-4">
        <StringInput
          label="Search Accounts"
          labelBL="Search by username, ID, about, provider, or status"
          current={searchTerm}
          update={setSearchTerm}
        />
      </div>
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
          {orderBy(filteredAccounts, [order], [reverse ? 'desc' : 'asc']).map((acc) => (
            <tr
              key={acc.id}
              className="hover:bg-primary hover:cursor-pointer hover:bg-opacity-20"
              onClick={() =>
                pushModal(
                  <ModalWrapper keepOpenOnClick>
                    <AccountDetail account={acc} refreshAccounts={refreshAccounts} />
                  </ModalWrapper>
                )
              }
            >
              <td>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    changeProvider(acc.provider)
                  }}
                >
                  {acc.provider}
                </button>
              </td>
              <td>{acc.username}</td>
              <td>
                {acc.last_login ? (
                  <TimeForHumans iso={acc.last_login} />
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
      {filteredAccounts.length === 0 && accounts.length > 0 && (
        <div className="text-center py-8 text-gray-500">No accounts match your search criteria</div>
      )}
    </div>
  ) : (
    <div className="w-24">
      <Spinner />
    </div>
  )
}

const AccountDetail = ({ account, refreshAccounts }) => {
  const { api } = useApi()
  const { role } = useAccount()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { pushModal, popModal } = useContext(ModalContext)

  const canModify = ['operator', 'engineer', 'root'].includes(role)

  const handleStatusToggle = async () => {
    const newStatus = account.status === 'active' ? 'disabled' : 'active'
    setLoadingStatus([true, `${newStatus === 'active' ? 'Enabling' : 'Disabling'} account...`])

    const result = await api.enableAccount(account.id, newStatus)
    if (result[1] === 200) {
      setLoadingStatus([
        true,
        `Account ${newStatus === 'active' ? 'enabled' : 'disabled'}`,
        true,
        true,
      ])
      refreshAccounts()
      popModal()
    } else {
      setLoadingStatus([true, `Failed to update account status`, true, false])
    }
  }

  const handleDelete = async () => {
    setLoadingStatus([true, 'Deleting account...'])

    const result = await api.deleteAccount(account.id)
    if (result[1] === 204) {
      setLoadingStatus([true, 'Account deleted', true, true])
      refreshAccounts()
      popModal()
    } else {
      setLoadingStatus([true, `Failed to delete account`, true, false])
    }
  }

  const confirmDelete = () => {
    pushModal(
      <ModalWrapper keepOpenOnClick>
        <div className="max-w-md w-full">
          <h2>Delete Account</h2>
          <p>
            Are you sure you want to delete the account <strong>{account.username}</strong>?
          </p>
          <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={popModal}>
              Cancel
            </button>
            <button className="btn btn-error" onClick={handleDelete}>
              Delete Account
            </button>
          </div>
        </div>
      </ModalWrapper>
    )
  }

  const editAbout = () => {
    pushModal(
      <ModalWrapper keepOpenOnClick>
        <EditAccountAbout
          account={account}
          refreshAccounts={refreshAccounts}
          popParentModal={popModal}
        />
      </ModalWrapper>
    )
  }

  return (
    <div className="max-w-4xl w-full">
      <div className="flex justify-between items-start mb-4">
        <h2>{account.id}</h2>
        {canModify && (
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={editAbout}>
              Edit About
            </button>
            {account.status !== 'pending' && (
              <button
                className={`btn btn-sm ${account.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                onClick={handleStatusToggle}
              >
                {account.status === 'active' ? 'Disable Account' : 'Enable Account'}
              </button>
            )}
            <button className="btn btn-sm btn-error" onClick={confirmDelete}>
              Delete Account
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Account Information</h3>
          <div className="space-y-2">
            <div>
              <strong>Username:</strong> {account.username}
            </div>
            <div>
              <strong>Provider:</strong> {account.provider}
            </div>
            <div>
              <strong>Role:</strong> <Role role={account.role} />
            </div>
            <div>
              <strong>Status:</strong> <AccountStatus status={account.status} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Metadata</h3>
          <div className="space-y-2">
            <div>
              <strong>Created by:</strong> {account.created_by}
            </div>
            <div>
              <strong>Created at:</strong> <TimeForHumans iso={account.created_at} />
            </div>
            {account.updated_by && (
              <div>
                <strong>Updated by:</strong> {account.updated_by}
              </div>
            )}
            {account.updated_at && (
              <div>
                <strong>Updated at:</strong> <TimeForHumans iso={account.updated_at} />
              </div>
            )}
            <div>
              <strong>Last login:</strong>{' '}
              {account.last_login ? <TimeForHumans iso={account.last_login} /> : <em>never</em>}
            </div>
          </div>
        </div>
      </div>

      {account.about && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <div className="bg-gray-100 p-3 rounded">{account.about}</div>
        </div>
      )}

      <Highlight js={account} title="Raw Account Data" />
    </div>
  )
}

const EditAccountAbout = ({ account, refreshAccounts, popParentModal }) => {
  const [about, setAbout] = useState(account.about || '')
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { popModal } = useContext(ModalContext)

  const handleSave = async () => {
    setLoadingStatus([true, 'Updating account...'])

    const result = await api.updateAccount(account.id, about)
    if (result[1] === 200) {
      setLoadingStatus([true, 'Account updated', true, true])
      refreshAccounts()
      popModal()
      popParentModal()
    } else {
      setLoadingStatus([true, `Failed to update account`, true, false])
    }
  }

  return (
    <div className="max-w-2xl w-full">
      <h2>Edit Account About</h2>
      <p className="mb-4">
        Editing about field for account: <strong>{account.username}</strong>
      </p>

      <TextInput
        label="About"
        labelBL="Description or notes about this account"
        current={about}
        update={setAbout}
      />

      <div className="flex gap-2 justify-end mt-4">
        <button className="btn btn-ghost" onClick={popModal}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

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

  if (!local)
    return (
      <Popout note>
        <h5>Local Morio Accounts are not available</h5>
        <p>
          No local accounts can be created because the <b>local</b> identity provider is not
          enabled.
        </p>
      </Popout>
    )

  return (
    <Popout note>
      <h5 className="flex flex-row gap-2 items-center w-full mb-4">
        <span className="grow">Local Morio Accounts are enabled</span>
        <button
          className="btn btn-primary"
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
  const { pushModal } = useContext(ModalContext)

  const createAccount = async (overwrite = false) => {
    setLoadingStatus([true, 'Contacting the Morio API'])
    const result = await api.createAccount({
      username,
      about,
      provider: 'local',
      role: userRole,
      overwrite,
    })
    if (result[1] === 200 && result[0].invite) {
      setLoadingStatus([true, 'Account created', true, true])
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <InviteResult data={result[0]} />
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

export const ActivateAccount = ({ invite = '', user = '', hidden = false }) => {
  const [inviteCode, setInviteCode] = useState(invite)
  const [username, setUsername] = useState(user)
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const [data, setData] = useState(false)
  const [mfa, setMfa] = useState('')
  const [password, setPassword] = useState('')
  const [scratchCodes, setScratchCodes] = useState(false)

  const activateAccount = async () => {
    setLoadingStatus([true, 'One moment please, contacting the Morio API'])
    const result = await api.activateAccount({ username, invite: inviteCode, provider: 'local' })
    if (result[1] === 200 && result[0]) {
      setLoadingStatus([true, 'Account needs to be setup', true, true])
      setData(result[0])
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
    if (result[1] === 200 && result[0]) {
      setLoadingStatus([true, 'Account activated', true, true])
      setScratchCodes(result[0].scratch_codes)
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
            <SecretInput
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
      {hidden ? (
        <Popout tip>
          <p>
            Clicking the button below will activate the Morio account with the following details:
          </p>
          <p>
            <b>Username:</b> <code>{username}</code>
            <br />
            <b>Invite Code:</b> <code>{inviteCode}</code>
          </p>
          <p>You will be asked to setup MFA as a prerequisite to activate the account.</p>
        </Popout>
      ) : (
        <>
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
        </>
      )}
      <p className={hidden ? '' : 'text-center'}>
        <button
          className="btn btn-primary"
          onClick={activateAccount}
          disabled={inviteCode.length !== 48 || username.length < 1}
        >
          Activate Account
        </button>
      </p>
    </div>
  )
}
