// Dependencies
import { rbac } from 'lib/utils.mjs'
// hooks
import { useContext } from 'react'
import { useAccount } from 'hooks/use-account.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
// compnoents
import { Link } from 'components/link.mjs'
import { WarningIcon } from 'components/icons.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'

const MissingRole = ({ role }) => (
  <div className="flex flex-row text-error items-center gap-2">
    <WarningIcon className="h-5 w-5"/> Role required: <code>{role}</code>
  </div>
)

export const Card = ({ desc, Icon = null, width = 'w-72', role=false, ...aProps }) => {
  const { account } = useAccount()
  const hasRole = role ? rbac(account.role, role) : true

  return (
    <Link
      className={`${width} border px-4 pb-4 rounded shadow hover:bg-secondary hover:bg-opacity-20 flex flex-col ${hasRole ? 'hover:bg-secondary' : 'hover:bg-error opacity-50'}`}
      {...aProps}
    >
      <h3 className={`capitalize text-base-content flex flex-row gap-2 items-center justify-between text-2xl`}>
        {aProps.title}
        <Icon className="w-8 h-8 shrink-0 grow-0" />
      </h3>
      <p className="grow">{desc}</p>
      {hasRole ? null : <MissingRole role={role} />}
    </Link>
  )
}

export const CardButton = ({ desc, Icon = null, width = 'w-72', role=false, ...btnProps }) => {
  const { account } = useAccount()
  const hasRole = role ? rbac(account.role, role) : true
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className={`${width} border px-4 pb-4 rounded shadow hover:bg-secondary hover:bg-opacity-20 flex flex-col ${hasRole ? 'hover:bg-secondary' : 'hover:bg-error opacity-50'}`}
      {...btnProps}
      onClick={hasRole ? btnProps.onClick : () => pushModal(
                <ModalWrapper>
                  <MissingRole role={role} />
                </ModalWrapper>
              )
            }
    >
      <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between text-2xl">
        {btnProps.title}
        <Icon className="w-8 h-8 shrink-0 grow-0" />
      </h3>
      <p className="grow text-left">{desc}</p>
      {hasRole ? null : <MissingRole role={role} />}
    </button>
  )
}

