import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { ShowLogs } from 'components/boards/logs.mjs'
import { shortUuid } from 'lib/utils.mjs'

export default function DashboardsHostLogsPage ({ host, module, logset }) {
  const meta = {
    title: 'Cached host logs',
    page: ['boards', 'logs', shortUuid(host), module, logset],
    Icon: LogsIcon
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowLogs host={host} module={module} logset={logset} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    host: params.host,
    module: params.module,
    logset: params.logset,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})


