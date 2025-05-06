import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PuzzleIcon } from 'components/icons.mjs'
import { ModsTable } from 'components/inventory/mod.mjs'

const meta = {
  title: 'Morio Modules',
  page: ['inventory', 'mod'],
  Icon: PuzzleIcon,
}

export default function InventoryModsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ModsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
