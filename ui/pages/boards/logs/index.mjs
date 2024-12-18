import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StorageIcon } from 'components/icons.mjs'
import { LogsTable } from 'components/boards/logs.mjs'

const FixmeDashboardsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StorageIcon}>
        <LogsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default FixmeDashboardsPage

export const getStaticProps = () => ({
  props: {
    title: 'Logs',
    page: ['dashboards', 'logs'],
  },
})
