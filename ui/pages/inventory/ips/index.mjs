import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { LocationIcon } from 'components/icons.mjs'
import { IpsTable } from 'components/inventory/ip.mjs'

const meta = {
  title: 'IP Adresses',
  page: ['inventory', 'ips'],
  Icon: LocationIcon,
}

export default function InventoryIpsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <IpsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
