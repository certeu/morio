import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { HostsTable } from 'components/inventory/host.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { ReloadDataButton } from 'components/button.mjs'

export default function InventoryHostsPage({ uuid = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)

  const meta = {
    title: 'Hosts',
    page: ['inventory', 'hosts', uuid ? uuid : 'unknown'],
    Icon: ServersIcon,
  }

  useEffect(() => {
    if (uuid) runApiCall(api, uuid).then(result => setData(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[count, uuid])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          {data === false
            ? <LoadFailed />
            : <HostsTable hosts={data} />
          }
          <ReloadDataButton onClick={() => setCount(count+1)} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}


async function runApiCall (api, uuid) {
  const result = await api.getInventoryHost(uuid)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

const LoadFailed = () => (
  <Popout warning>
    <h4>Failed to load hosts from the inventory</h4>
    <p>This is unexpected. Please report this.</p>
  </Popout>
)

export const getStaticProps = ({ params }) => ({
  props: {
    uuid: params.uuid,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})

