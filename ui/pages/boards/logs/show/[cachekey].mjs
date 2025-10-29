// Hooks
import { useApi } from 'hooks/use-api.mjs'
import { useEffect, useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LogsIcon } from 'components/icons.mjs'
import { ShowLogs } from 'components/boards/logs.mjs'

export default function DashboardsShowLogsPage({ cachekey }) {
  const { api } = useApi()
  const [ _, host, module, dataset ] = cachekey.split('|')
  const meta = {
    title: `Logs: ${dataset}`,
    page: [ 'boards', 'logs', 'show', 'key' ],
    Icon: LogsIcon,
  }

  const [fqdn, setFqdn] = useState(false)
  useEffect(() => {
    getHostFqdn(host, setFqdn, api)
  }, [host])

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

async function getHostFqdn(host, setFqdn, api) {
  let result
  try {
    result = await api.getInventoryHostname(host)
  }
  catch (err) {
    console.log(err)
  }

  return (result[1] === 200 && result[0]?.fqdn)
    ? result[0].fqdn
    : false
}
