// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { MetricsIcon } from 'components/icons.mjs'
import { ShowMetrics } from 'components/boards/metrics.mjs'
import { getHostFqdn } from 'components/boards/shared.mjs'

export default function DashboardsShowMetricsPage({ cachekey }) {
  const { api } = useApi()
  const [host, module, dataset] = cachekey.split('|').slice(1)

  const [fqdn, setFqdn] = useState(host)
  useEffect(() => {
    getHostFqdn(host, setFqdn, api)
  }, [host, api])

  const meta = {
    title: `Metrics: ${dataset}`,
    page: ['boards', 'metrics', 'show', cachekey],
    Icon: MetricsIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowMetrics host={host} module={module} metricset={dataset} hostname={fqdn} />
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
