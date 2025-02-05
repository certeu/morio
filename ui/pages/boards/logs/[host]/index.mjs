import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { HostLogsTable } from 'components/boards/logs.mjs'

export default function DashboardsHostLogsPage({ host }) {
  const meta = {
    title: 'Cached host logs',
    page: ['boards', 'logs', host],
    Icon: LogsIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostLogsTable host={host} />
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
