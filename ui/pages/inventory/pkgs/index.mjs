import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PackageIcon } from 'components/icons.mjs'
import { PkgsTable } from 'components/inventory/pkgs.mjs'

const meta = {
  title: 'Software Packages',
  page: ['inventory', 'pkgs'],
  Icon: PackageIcon,
}

export default function InventoryPkgsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <PkgsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
