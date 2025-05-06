import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CodeIcon } from 'components/icons.mjs'
import { ModfilesTable } from 'components/inventory/modfile.mjs'

const meta = {
  title: 'Module Files',
  page: ['inventory', 'modfiles'],
  Icon: CodeIcon,
}

export default function InventoryModfilesPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ModfilesTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
