import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { VariableIcon } from 'components/icons.mjs'
import { HostvarDetail } from 'components/inventory/hostvar.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryHostvarPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading host variable data...')

  const meta = {
    title: title ? id : 'Loading host variable data',
    page: ['inventory', 'hostvars', id ? id : 'unknown'],
    Icon: VariableIcon,
  }

  useEffect(() => {
    if (id)
      runHostvarApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.key)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <HostvarDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runHostvarApiCall(api, id) {
  const result = await api.getInventoryHostvar(id)
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
