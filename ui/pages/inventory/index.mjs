import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { PageLink } from 'components/link.mjs'

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

  const [data, setData] = useState()
  const [count, setCount] = useState(0)

  useEffect(() => {
    runApiCall(api).then(result => {
      if (result[1] === 200) setData(result[0])
    })
  },[count])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <div className="stats shadow w-full">
            <Stat title="Hosts" nr={data?.hosts} Icon={ServersIcon} link="/inventory/hosts"/>
            <Stat title="IP Addresses" nr={data?.ips} Icon={ServersIcon} link="/inventory/ips"/>
            <Stat title="MAC Addresses" nr={data?.macs} Icon={ServersIcon} link="/inventory/macs"/>
          </div>
          <Popout fixme>
            <h4>Apologies, but this is a work in progress</h4>
            <p>This page is here to indicate the direction we are going in, but we are not there yet.</p>
          </Popout>
          <button className="btn btn-primary" onClick={() => setCount(count+1)}>Trigger Update</button>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}


async function runApiCall (api) {
  const result = api.getInventoryStats()
  return result
}

