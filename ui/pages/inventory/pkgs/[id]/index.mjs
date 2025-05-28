import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PackageIcon } from 'components/icons.mjs'
import { PkgDetail } from 'components/inventory/pkg.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryPkgPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading pkg data...')

  const meta = {
    title: title ? id : 'Loading pkg data',
    page: ['inventory', 'pkgs', id ? id : 'unknown'],
    Icon: PackageIcon,
  }

  useEffect(() => {
    if (id)
      runPkgApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.id)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <PkgDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runPkgApiCall(api, id) {
  const result = await api.getInventoryPkg(id)
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
