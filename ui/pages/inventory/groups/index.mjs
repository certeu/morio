import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { GroupIcon } from 'components/icons.mjs'
import { GroupsTable, GroupsHierarchy } from 'components/inventory/group.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const meta = {
  title: 'Groups',
  page: ['inventory', 'groups'],
  Icon: GroupIcon,
}

export default function InventoryHostsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Tabs tabs="Inventory Group List, Inventory Group Hierarchy">
          <Tab tabId="Inventory Group List">
            <GroupsTable />
          </Tab>
          <Tab tabId="Inventory Group Hierarchy">
            <GroupsHierarchy />
          </Tab>
        </Tabs>
      </ContentWrapper>
    </PageWrapper>
  )
}
