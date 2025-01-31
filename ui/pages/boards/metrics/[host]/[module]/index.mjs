import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { HostMetricsTable } from 'components/boards/metrics.mjs'

export default function DashboardsHostMetricsPage({ host, module }) {
  const meta = {
    title: 'Cached host metrics',
    page: ['boards', 'metrics', host, module],
    Icon: StatusIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostMetricsTable host={host} module={module} />
      </ContentWrapper>
    </PageWrapper>
  )
}

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
