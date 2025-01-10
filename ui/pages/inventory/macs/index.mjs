import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { HardwareIcon } from 'components/icons.mjs'
import { MacsTable } from 'components/inventory/mac.mjs'

const meta = {
  title: 'MAC Adresses',
  page: ['inventory', 'macs'],
  Icon: HardwareIcon,
}

export default function InventoryMacsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <MacsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
