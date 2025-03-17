import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CodeIcon } from 'components/icons.mjs'
import { ModsTable } from 'components/inventory/modfiles.mjs'

const meta = {
  title: 'Module Files',
  page: ['inventory', 'modfiles'],
  Icon: CodeIcon,
}

export default function InventoryModfilesPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ModsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
