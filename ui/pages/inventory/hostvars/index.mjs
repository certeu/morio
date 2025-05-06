import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { VariableIcon } from 'components/icons.mjs'
import { HostvarsTable } from 'components/inventory/hostvar.mjs'

const meta = {
  title: 'Host Vars',
  page: ['inventory', 'hostvars'],
  Icon: VariableIcon,
}

export default function InventoryHostvarsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <HostvarsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
