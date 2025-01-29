import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { FlagIcon } from 'components/icons.mjs'
import { Events } from 'components/boards/events.mjs'

const meta = {
  title: 'Events',
  page: ['boards', 'events'],
  Icon: FlagIcon,
}

export default function EventsDashboardPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Events />
      </ContentWrapper>
    </PageWrapper>
  )
}
