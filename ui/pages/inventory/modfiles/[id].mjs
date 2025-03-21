import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CodeIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { ModuleFile } from 'components/inventory/mac.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { ReloadDataButton } from 'components/button.mjs'

export default function InventoryModfilePage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)

  const meta = {
    title: 'Module File',
    page: ['inventory', 'modfiles', id ? id : 'unknown'],
    Icon: CodeIcon,
  }

  useEffect(() => {
    if (id) runApiCall(api, id).then((result) => setData(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [count, id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          {data === false ? <LoadFailed /> : <ModuleFile data={data} />}
          <ReloadDataButton onClick={() => setCount(count + 1)} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runApiCall(api, id) {
  const result = await api.getInventoryModfile(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

const LoadFailed = () => (
  <Popout warning>
    <h4>Failed to load Module file from the inventory</h4>
    <p>This is unexpected. Please report this.</p>
  </Popout>
)

export const getStaticProps = ({ params }) => ({
  props: {
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
