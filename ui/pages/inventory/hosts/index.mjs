import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { HostsTable } from 'components/inventory/host.mjs'
import { useApi } from 'hooks/use-api.mjs'

const meta = {
  title: 'Hosts',
  page: ['inventory', 'hosts'],
  Icon: ServersIcon,
}

export default function InventoryHostsPage() {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    runApiCall(api).then(result => setData(result))
  },[count])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          {data === false
            ? <LoadFailed />
            : <HostsTable hosts={data} />
          }
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}


async function runApiCall (api) {
  const result = await api.getInventoryHosts()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

const LoadFailed = () => (
  <Popout warning>
    <h4>Failed to load hosts from the inventory</h4>
    <p>This is unexpected. Please report this.</p>
  </Popout>
)
