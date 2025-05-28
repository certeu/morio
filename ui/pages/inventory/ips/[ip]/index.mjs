import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LocationIcon } from 'components/icons.mjs'
import { IpDetail } from 'components/inventory/ip.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryIpPage({ ip = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading ip data...')

  const meta = {
    title: title ? ip : 'Loading ip data',
    page: ['inventory', 'ips', ip ? ip : 'unknown'],
    Icon: LocationIcon,
  }

  useEffect(() => {
    if (ip)
      runIpApiCall(api, ip).then((result) => {
        setData(result)
        setTitle(result.ip)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ip])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <IpDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runIpApiCall(api, ip) {
  const result = await api.getInventoryIp(ip)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    ip: params.ip,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
