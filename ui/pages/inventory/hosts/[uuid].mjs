import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { Host } from 'components/inventory/host.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryHostPage({ uuid = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading host data...')

  const meta = {
    title,
    page: ['inventory', 'hosts', uuid ? uuid : 'unknown'],
    Icon: ServersIcon,
  }

  useEffect(() => {
    if (uuid)
      runApiCall(api, uuid).then((result) => {
        setData(result)
        setTitle(result.fqdn)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uuid])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <Host data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runApiCall(api, uuid) {
  const result = await api.getInventoryHost(uuid)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    uuid: params.uuid,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
