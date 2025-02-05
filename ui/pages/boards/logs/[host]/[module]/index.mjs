import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { HostLogsTable } from 'components/boards/logs.mjs'

export default function DashboardsHostLogsPage({ host, module }) {
  const meta = {
    title: 'Cached host logs',
    page: ['boards', 'logs', host, module],
    Icon: LogsIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostLogsTable host={host} module={module} />
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
