// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusLogs } from 'components/status-logs.mjs'
import { StorageIcon } from 'components/icons.mjs'

const StatuslogsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StorageIcon} title={props.title}>
        <StatusLogs />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatuslogsPage

export const getStaticProps = () => ({
  props: {
    title: 'Status Logs',
    page: ['status', 'logs'],
  },
})
