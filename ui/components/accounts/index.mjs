import orderBy from 'lodash.orderby'
// Context
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { PlayIcon } from 'components/icons.mjs'
import { MsAgo } from 'components/time-ago.mjs'
import { LogoSpinner } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'

/**
 * React component to display the accounts
 */
export const ListAccounts = () => {
  const [accounts, setAccounts] = useState(false)
  const [provider, setProvider] = useState(false)
  const [order, setOrder] = useState('lastLogin')
  const [reverse, setReverse] = useState(false)

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
          {['id', 'provider', 'username', 'lastLogin', 'status'].map((key) => (
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
          <tr key={acc.id} className="hover:bg-primary hover:cursor-pointer hover:bg-opacity-20">
            <td>
              <button
                className="btn btn-neutral btn-outline btn-sm"
                href={`/tools/accounts/${acc.id}`}
              >
                {acc.id}
              </button>
            </td>
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

const statusColors = {
  active: 'success',
  blocked: 'error',
  pending: 'warning',
  unknown: 'neutral',
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

const AddLocalAccountModal = () => {
  const [username, setUsername] = useState('')
  const [about, setAbout] = useState('')
  const { api } = useApi()

  const createAccount = async () => {
    const result = await api.createAccount({ username, about, provider: 'local' })
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
