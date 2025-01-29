import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { LogsTable } from 'components/boards/logs.mjs'

export default function DashboardsLogsPage(props) {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={LogsIcon}>
        <LogsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = () => ({
  props: {
    title: 'Logs',
    page: ['boards', 'logs'],
  },
})
