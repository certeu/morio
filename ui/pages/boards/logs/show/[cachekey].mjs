import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { ShowLogs } from 'components/boards/logs.mjs'

export default function DashboardsShowLogsPage({ cachekey }) {
  const meta = {
    title: 'Show cached logs',
    page: [
      'boards',
      'logs',
      'show',
      <span key="ck" className="font-mono">
        {cachekey}
      </span>,
    ],
    Icon: LogsIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowLogs cachekey={cachekey} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    cachekey: params.cachekey,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
