import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { ShowMetrics } from 'components/boards/metrics.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function DashboardsHostMetricsPage({ host, module, metricset }) {
  const { api } = useApi()

  const [hostname, setHostname] = useState(host)

  useEffect(() => {
    async function getHostName() {
      let result
      try {
        result = await api.getInventoryHostname(host)
        if (result.fqdn) setHostname(result.fqdn)
      } catch (err) {
        console.log(err)
      }
    }
    getHostName()
  }, [host, api])

  const meta = {
    title: (
      <span className="text-4xl font-medium">
        <span className="font-light">{module}</span>
        <span className="font-light px-1 opacity-50">/</span>
        <span className="font-bold">{metricset}</span>
        <br />
        <span className="text-xl font-light pr-1 pacity-50">on</span>
        <span className="text-2xl font-medium">{hostname}</span>
      </span>
    ),
    page: ['boards', 'metrics', host, module, metricset],
    Icon: StatusIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ShowMetrics host={host} module={module} metricset={metricset} hostname={hostname} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    host: params.host,
    module: params.module,
    metricset: params.metricset,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
