import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { VariableIcon } from 'components/icons.mjs'
import { ModvarDetail } from 'components/inventory/modvar.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryModvarPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading module variable data...')

  const meta = {
    title: title ? id : 'Loading module variable data',
    page: ['inventory', 'modvars', id ? id : 'unknown'],
    Icon: VariableIcon,
  }

  useEffect(() => {
    if (id)
      runModvarApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.val)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <ModvarDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runModvarApiCall(api, id) {
  const result = await api.getInventoryModvar(id)
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
