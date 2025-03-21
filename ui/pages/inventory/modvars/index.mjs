import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { VariableIcon } from 'components/icons.mjs'
import { ModvarsTable } from 'components/inventory/modvars.mjs'

const meta = {
  title: 'Module Vars',
  page: ['inventory', 'modvars'],
  Icon: VariableIcon,
}

export default function InventoryModvarsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ModvarsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
