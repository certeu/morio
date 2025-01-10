import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { HostsTable } from 'components/inventory/host.mjs'

const meta = {
  title: 'Hosts',
  page: ['inventory', 'hosts'],
  Icon: ServersIcon,
}

export default function InventoryHostsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
