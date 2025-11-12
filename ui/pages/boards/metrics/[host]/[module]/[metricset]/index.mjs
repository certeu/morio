// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useState } from 'react'
// Components
import { Link } from 'components/link.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { MetricsTable } from 'components/boards/metrics.mjs'
import { MiniTip } from 'components/mini.mjs'
import { getHostFqdn } from 'components/boards/shared.mjs'

const DashboardsMetricsPageHostModuleDataset = ({ host = '', module = '', metricset = '' }) => {
  const { api } = useApi()
  const [fqdn, setFqdn] = useState(host)
  const meta = {
    title: 'Metrics',
    page: ['boards', 'metrics', fqdn, module, metricset],
    Icon: StatusIcon,
  }

  useEffect(() => {
    getHostFqdn(host, setFqdn, api)
  }, [host, api])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <MiniTip>
          Metrics for dataset <b>{metricset}</b> from module <b>{module}</b> on host{' '}
          <Link href={`/inventory/hosts/${host}/`}>{fqdn}</Link>
        </MiniTip>
        <MetricsTable glob={`metric|${host}|${module}|${metricset}`} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsMetricsPageHostModuleDataset

export const getStaticProps = ({ params }) => ({
  props: {
    host: params.host,
    module: params.module,
    metricset: params.metricset,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
