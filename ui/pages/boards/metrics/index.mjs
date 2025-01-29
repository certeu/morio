import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { MetricsTable } from 'components/boards/metrics.mjs'

const meta = {
  title: 'Metrics',
  page: ['boards', 'metrics'],
  Icon: StatusIcon,
}

const DashboardsMetricsPage = () => {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <MetricsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsMetricsPage
