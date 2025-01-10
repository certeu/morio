import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { SettingsEditor } from 'components/settings/editor.mjs'
import { NoteIcon } from 'components/icons.mjs'

const EditSettingsPage = (props) => {
  return (
    <PageWrapper {...props} role="operator">
      <ContentWrapper {...props} Icon={NoteIcon}>
        <div className="w-full">
          <SettingsEditor />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default EditSettingsPage

export const getStaticProps = () => ({
  props: {
    title: 'Edit Settings',
    page: ['settings', 'edit'],
  },
})
