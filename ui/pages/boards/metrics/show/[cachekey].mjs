// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { ShowMetrics } from 'components/boards/metrics.mjs'
import { getHostFqdn, getInventoryHosts } from 'components/boards/shared.mjs'

export default function DashboardsShowMetricsPage({ cachekey }) {
  const { api } = useApi()

  const type = cachekey.slice(0, 11) === 'metric|top-' ? 'top' : 'dataset'

  const [host, module, dataset] =
    type === 'dataset' ? cachekey.split('|').slice(1) : [false, false, false]

  const [fqdn, setFqdn] = useState(host)
  const [inventory, setInventory] = useState(host)
  useEffect(() => {
    if (type === 'dataset') getHostFqdn(host, setFqdn, api)
    else if (type === 'top') getInventoryHosts(setInventory, api)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [host, api])

  const meta = {
    title: `Metrics: ${type === 'dataset' ? dataset : cachekey.split('|').slice(1)}`,
    page: ['boards', 'metrics', 'show', cachekey],
    Icon: StatusIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowMetrics {...{ host, module, dataset, cachekey, type, inventory }} hostname={fqdn} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    cachekey: params.cachekey,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
