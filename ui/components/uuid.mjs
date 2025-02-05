import { shortUuid } from 'lib/utils.mjs'
import { PageLink } from 'components/link.mjs'
import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'

export const Uuid = ({ uuid, href }) => {
  if (!uuid) return <MissingUuid />

  if (href === false)
    return (
      <span className="flex flex-row items-center">
        <span className="badge badge-primary font-mono">{shortUuid(uuid)}</span>
        <CopyToClipboard content={uuid} label="UUID" sup />
      </span>
    )

  if (typeof href === 'undefined') href = `/inventory/hosts/${uuid}`

  return (
    <span className="flex flex-row items-center">
      <PageLink href={href} title={uuid}>
        <span className="badge badge-primary font-mono">{shortUuid(uuid)}</span>
      </PageLink>
      <CopyToClipboard content={uuid} label="UUID" sup />
    </span>
  )
}

const MissingUuid = () => (
  <span className="flex flex-row items-center">
    <span className="badge badge-warning font-mono"> {shortUuid()}</span>
  </span>
)
