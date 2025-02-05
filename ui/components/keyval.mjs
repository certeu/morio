import { useContext } from 'react'
import { CopyToClipboard as Copy } from 'react-copy-to-clipboard'
import { LoadingStatusContext } from 'context/loading-status.mjs'

export const KeyVal = ({ k, val, color = 'primary', small = false, onClick = false }) => {
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const inner = (
    <>
      <span
        className={`${sharedClasses} rounded-l${small ? '' : '-lg'} text-${color}-content bg-${color} border-${color} ${small ? 'text-xs' : ''}`}
      >
        {k}
      </span>
      <span
        className={`${sharedClasses} rounded-r${small ? '' : '-lg'} text-${color} bg-base-100 border-${color} ${small ? 'text-xs' : ''}`}
      >
        {val}
      </span>
    </>
  )

  return onClick ? (
    <button onClick={onClick}>{inner}</button>
  ) : (
    <Copy text={val} onCopy={() => handleCopied(setLoadingStatus, k)}>
      <button>{inner}</button>
    </Copy>
  )
}

const sharedClasses = `px-1 text-sm font-medium whitespace-nowrap border-2`

const handleCopied = (setLoadingStatus, label) => {
  setLoadingStatus([
    true,
    label ? `${label} copied to clipboard` : 'Copied to clipboard',
    true,
    true,
  ])
}
