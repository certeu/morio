import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { HostLogsTable } from 'components/boards/logs.mjs'
import { Uuid } from 'components/uuid.mjs'

export default function DashboardsHostLogsPage ({ uuid }) {
  const meta = {
    title: 'Cached host logs',
    page: ['dashboards', 'logs', 'host', <Uuid uuid={uuid}/>],
    Icon: LogsIcon
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostLogsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    uuid: params.uuid,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})


