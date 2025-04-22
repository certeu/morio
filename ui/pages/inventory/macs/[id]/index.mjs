import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { HardwareIcon } from 'components/icons.mjs'
import { MacDetail } from 'components/inventory/mac.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryMacPage({ mac = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [title, setTitle] = useState('Loading mac data...')

  const meta = {
    title: title ? mac : 'Loading mac data',
    page: ['inventory', 'macs', mac ? mac : 'unknown'],
    Icon: HardwareIcon,
  }

  useEffect(() => {
    if (mac)
      runMacApiCall(api, mac).then((result) => {
        setData(result)
        setTitle(result.mac)
      })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mac])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <MacDetail data={data} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runMacApiCall(api, mac) {
  const result = await api.getInventoryMac(mac)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    mac: params.mac,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
