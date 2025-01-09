import { useState, useEffect, useContext } from 'react'
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { HardwareIcon, LocationIcon, PowerIcon, ServersIcon } from 'components/icons.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'

const meta = {
  title: 'Inventory',
  page: ['inventory'],
  Icon: ServersIcon,
}

const Stat = ({ title, nr, Icon, link }) => (
  <div className="stat">
    <div className="stat-figure text-primary"><Icon className="w-10 h-10" /></div>
    <div className="stat-title">{title}</div>
    <div className="stat-value text-primary">{nr}</div>
    <div className="stat-desc"><PageLink href={link}>{link}</PageLink></div>
  </div>
)

export default function InventoryPage() {
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const [data, setData] = useState()
  const [count, setCount] = useState(0)

  useEffect(() => {
    runApiCall(api).then(result => {
      setLoadingStatus([true, "Loading inventory data"])
      if (result[1] === 200) {
        setData(result[0])
        setLoadingStatus([true, "Inventory data loaded", true, true])
      }
      else setLoadingStatus([true, "Failed to load inventory data", true, false])
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[count])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="stats shadow w-full">
          <Stat title="Hosts" nr={data?.hosts} Icon={ServersIcon} link="/inventory/hosts"/>
          <Stat title="IP Addresses" nr={data?.ips} Icon={LocationIcon} link="/inventory/ips"/>
          <Stat title="MAC Addresses" nr={data?.macs} Icon={HardwareIcon} link="/inventory/macs"/>
          <Stat title="Operating Systems" nr={data?.oss} Icon={({className}) => <PowerIcon className={className} stroke={2.5}/>} link="/inventory/oss"/>
        </div>
        <ReloadDataButton onClick={() => setCount(count+1)} />
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runApiCall (api) {
  const result = api.getInventoryStats()
  return result
}

