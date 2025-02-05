import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { WindowIcon } from 'components/icons.mjs'
import { OssTable } from 'components/inventory/oss.mjs'

const meta = {
  title: 'Operating Systems',
  page: ['inventory', 'oss'],
  Icon: WindowIcon,
}

export default function InventoryOssPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <OssTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
