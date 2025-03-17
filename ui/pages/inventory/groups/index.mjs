import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { GroupIcon } from 'components/icons.mjs'
import { GroupsTable, NewGroupButton } from 'components/inventory/group.mjs'

const meta = {
  title: 'Groups',
  page: ['inventory', 'groups'],
  Icon: GroupIcon,
}

export default function InventoryHostsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="flex flex-row justify-end w-full">
          <NewGroupButton />
        </div>
        <GroupsTable />
      </ContentWrapper>
    </PageWrapper>
  )
}
