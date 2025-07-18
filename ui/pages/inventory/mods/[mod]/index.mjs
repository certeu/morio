import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PuzzleIcon } from 'components/icons.mjs'
import { ModDetail } from 'components/inventory/mod.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryModPage({ mod = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading module data...')
  const [refresh, setRefresh] = useState(0)

  const meta = {
    title: title ? mod : 'Loading module data',
    page: ['inventory', 'mods', mod ? mod : 'unknown'],
    Icon: PuzzleIcon,
  }

  useEffect(() => {
    if (refresh > 0) {
      runModApiCall(api, mod).then((result) => {
        setData(result)
        setTitle(result.mod)
        setRefresh(0)
      })
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  useEffect(() => {
    if (mod)
      runModApiCall(api, mod).then((result) => {
        setData(result)
        setTitle(result.mod)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mod])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <ModDetail data={data} refresh={refresh} setRefresh={setRefresh} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runModApiCall(api, mod) {
  const result = await api.getInventoryMod(mod)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    mod: params.mod,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
