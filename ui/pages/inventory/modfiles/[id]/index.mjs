import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { HardwareIcon } from 'components/icons.mjs'
import { ModfileDetail } from 'components/inventory/modfile.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryModfilePage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading module file data...')

  const meta = {
    title: title ? id : 'Loading module file data',
    page: ['inventory', 'modfiles', id ? id : 'unknown'],
    Icon: HardwareIcon,
  }

  useEffect(() => {
    if (id)
      runModfileApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.file)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <ModfileDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runModfileApiCall(api, id) {
  const result = await api.getInventoryModfile(id)
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
