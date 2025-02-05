import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CheckCircleIcon } from 'components/icons.mjs'
import { ChecksTable } from 'components/boards/checks.mjs'

const meta = {
  title: 'Health Checks',
  page: ['boards', 'checks'],
  Icon: CheckCircleIcon,
}

export default function ChecksDashboardsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ChecksTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
