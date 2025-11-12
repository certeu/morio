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

const DashboardsMetricsPageHostModule = ({ host = '', module = '' }) => {
  const { api } = useApi()
  const [fqdn, setFqdn] = useState(host)
  const meta = {
    title: 'Metrics',
    page: ['boards', 'metrics', fqdn, module],
    Icon: StatusIcon,
  }

  useEffect(() => {
    getHostFqdn(host, setFqdn, api)
  }, [host, api])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <MiniTip>
          Metrics for module <b>{module}</b> on host{' '}
          <Link href={`/inventory/hosts/${host}/`}>{fqdn}</Link>
        </MiniTip>
        <MetricsTable glob={`metric|${host}|${module}|*`} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsMetricsPageHostModule

export const getStaticProps = ({ params }) => ({
  props: {
    host: params.host,
    module: params.module,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
