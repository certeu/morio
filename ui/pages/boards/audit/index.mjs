import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { FingerprintIcon } from 'components/icons.mjs'
import { Audit } from 'components/boards/audit.mjs'

const meta = {
  title: 'Audit',
  page: ['boards', 'audit'],
  Icon: FingerprintIcon,
}

export default function AuditDashboardsPage () {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Audit />
      </ContentWrapper>
    </PageWrapper>
  )
}
