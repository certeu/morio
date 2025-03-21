import { useState, useEffect, useContext } from 'react'
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import {
  HostvarIcon,
  ModulevarIcon,
  GroupvarIcon,
  GroupIcon,
  CodeIcon,
  PuzzleIcon,
  HardwareIcon,
  LocationIcon,
  PackageIcon,
  ServersIcon,
  WindowIcon,
} from 'components/icons.mjs'
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
    <div className="stat-figure">
      <Icon className="w-10 h-10" />
    </div>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{nr}</div>
    <div className="stat-desc">
      <PageLink href={link}>{link}</PageLink>
    </div>
  </div>
)

export default function InventoryPage() {
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const [data, setData] = useState()
  const [count, setCount] = useState(0)

  useEffect(() => {
    runApiCall(api).then((result) => {
      setLoadingStatus([true, 'Loading inventory data'])
      if (result[1] === 200) {
        setData(result[0])
        setLoadingStatus([true, 'Inventory data loaded', true, true])
      } else setLoadingStatus([true, 'Failed to load inventory data', true, false])
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [count])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="stats shadow w-full grid grid-cols-3 mb-2">
          <Stat title="Groups" nr={data?.groups} Icon={GroupIcon} link="/inventory/groups" />
          <Stat title="Group Vars" nr={data?.groupvars} Icon={GroupvarIcon} link="/inventory/groupvars" />
          <Stat title="Hosts" nr={data?.hosts} Icon={ServersIcon} link="/inventory/hosts" />
          <Stat title="Host Vars" nr={data?.hostvars} Icon={HostvarIcon} link="/inventory/hostvars" />
        </div>
        <div className="stats shadow w-full grid grid-cols-4 mb-2">
          <Stat title="IP Addresses" nr={data?.ips} Icon={LocationIcon} link="/inventory/ips" />
          <Stat title="MAC Addresses" nr={data?.macs} Icon={HardwareIcon} link="/inventory/macs" />
          <Stat title="Morio Modules" nr={data?.mods} Icon={PuzzleIcon} link="/inventory/mods" />
          <Stat title="Module Files" nr={data?.modfiles} Icon={CodeIcon} link="/inventory/modfiles" />
        </div>
        <div className="stats shadow w-full grid grid-cols-3 mb-2">
          <Stat title="Module Vars" nr={data?.modvars} Icon={ModulevarIcon} link="/inventory/modvars" />
          <Stat title="Operating Systems" nr={data?.oss} Icon={WindowIcon} link="/inventory/oss" />
          <Stat title="Software Packages" nr={data?.pkgs} Icon={PackageIcon} link="/inventory/pkgs" />
        </div>
        <ReloadDataButton onClick={() => setCount(count + 1)} />
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runApiCall(api) {
  const result = api.getInventoryStats()
  return result
}
