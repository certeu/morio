import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { ShowMetrics } from 'components/boards/metrics.mjs'
import { Uuid } from 'components/uuid.mjs'

export default function DashboardsHostMetricsPage({ host, module, metricset }) {
  const meta = {
    title: 'Cached host metrics',
    page: ['boards', 'metrics', <Uuid key="uuid" uuid={host} />, module, metricset],
    Icon: StatusIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowMetrics host={host} module={module} metricset={metricset} />
      </ContentWrapper>
    </PageWrapper>
  )
}

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
