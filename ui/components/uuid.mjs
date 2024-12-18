import { shortUuid } from 'lib/utils.mjs'
import { useState } from 'react'
import { PageLink } from 'components/link.mjs'
import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'

export const Uuid = ({ uuid, link="host" }) => {
  const [full, setFull] = useState()
  const short = shortUuid(uuid)

  return link
    ? (
      <span className="flex flex-row items-center">
        <PageLink href={`/inventory/hosts/${uuid}`} title={`Host ${short}`}>
          <span className="badge badge-primary font-mono">{shortUuid(uuid)}</span>
        </PageLink>
        <CopyToClipboard content={uuid} label="UUID" sup />
      </span>
    ) : (
      <span className="flex flex-row items-center">
        <span className="badge badge-primary font-mono">{shortUuid(uuid)}</span>
        <CopyToClipboard content={uuid}label="UUID"  sup />
      </span>
    )
}

