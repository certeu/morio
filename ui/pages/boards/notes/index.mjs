import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { TipIcon } from 'components/icons.mjs'
import { Notes } from 'components/boards/notes.mjs'

const meta = {
  title: 'Notes',
  page: ['boards', 'notes'],
  Icon: TipIcon,
}

export default function NotesDashboardPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Notes />
      </ContentWrapper>
    </PageWrapper>
  )
}
