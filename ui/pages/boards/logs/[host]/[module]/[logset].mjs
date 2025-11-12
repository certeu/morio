// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useState } from 'react'
// Components
import { Link } from 'components/link.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { LogsTable } from 'components/boards/logs.mjs'
import { MiniTip } from 'components/mini.mjs'
import { getHostFqdn } from 'components/boards/shared.mjs'

const DashboardsLogsPageHostModuleDataset = ({ host = '', module = '', logset = '' }) => {
  const { api } = useApi()
  const [fqdn, setFqdn] = useState(host)
  const meta = {
    title: 'Logs',
    page: ['boards', 'logs', fqdn, module, logset],
    Icon: LogsIcon,
  }

  useEffect(() => {
    getHostFqdn(host, setFqdn, api)
  }, [host, api])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <MiniTip>
          Logs for dataset <b>{logset}</b> from module <b>{module}</b> on host{' '}
          <Link href={`/inventory/hosts/${host}/`}>{fqdn}</Link>
        </MiniTip>
        <LogsTable glob={`log|${host}|${module}|${logset}`} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsLogsPageHostModuleDataset

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
