import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { OsDetail } from 'components/inventory/os.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryOsPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading os data...')

  const meta = {
    title: title ? id : 'Loading os data',
    page: ['inventory', 'oss', id ? id : 'unknown'],
    Icon: ServersIcon,
  }

  useEffect(() => {
    if (id)
      runOsApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.id)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <OsDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runOsApiCall(api, id) {
  const result = await api.getInventoryOs(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
