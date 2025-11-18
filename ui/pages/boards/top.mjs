import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { TopMetrics } from 'components/boards/metrics.mjs'

const meta = {
  title: 'Top Metrics',
  page: ['boards', 'top'],
  Icon: StatusIcon,
}

const DashboardsTopMetricsPage = () => {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <TopMetrics />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsTopMetricsPage
