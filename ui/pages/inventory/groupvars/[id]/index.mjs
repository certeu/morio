import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { GroupIcon } from 'components/icons.mjs'
import { GroupvarDetail } from 'components/inventory/groupvar.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryGroupvarPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading groupvar data...')

  const meta = {
    title: id ? data.key : 'Loading groupvar data',
    page: ['inventory', 'groupvars', id ? id : 'unknown'],
    Icon: GroupIcon,
  }

  useEffect(() => {
    if (id)
      runGroupvarApiCall(api, id).then((result) => {
        setData(result)
        setTitle(`Groupvar ${result.key}`)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <GroupvarDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runGroupvarApiCall(api, id) {
  const result = await api.getInventoryGroupvar(id)
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
