import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { GroupvarIcon } from 'components/icons.mjs'
import { GroupvarsTable } from 'components/inventory/groupvar.mjs'

const meta = {
  title: 'Group Vars',
  page: ['inventory', ['groupvars', 'Group Vars']],
  Icon: GroupvarIcon,
}

export default function InventoryGroupvarsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <GroupvarsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
