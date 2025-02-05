import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { HostMetricsTable } from 'components/boards/metrics.mjs'

export default function DashboardsHostMetricsPage({ host }) {
  const meta = {
    title: 'Cached host metrics',
    page: ['boards', 'metrics', host],
    Icon: StatusIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostMetricsTable host={host} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    host: params.host,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
