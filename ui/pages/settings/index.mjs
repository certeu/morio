import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { NoteIcon, SettingsIcon, DocumentIcon, CheckCircleIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const SettingsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={SettingsIcon}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              role="operator"
              title={<span>Edit Settings</span>}
              href="/settings/edit"
              desc="Edit the Morio settings as YAML or JSON."
              width="w-full"
              Icon={NoteIcon}
            />
            <Card
              role="operator"
              title={<span>Show Settings</span>}
              href="/settings/show"
              desc="Display the currently deployed Morio settings."
              width="w-full"
              Icon={DocumentIcon}
            />
            <Card
              role="operator"
              title={<span>Show Presets</span>}
              href="/settings/presets"
              desc="Display the current values of the Morio presets."
              width="w-full"
              Icon={CheckCircleIcon}
            />
            <Card
              role="operator"
              title={<span>Update Settings</span>}
              href="/settings/wizard"
              desc="Update the Morio settings using the settings wizard."
              width="w-full"
              Icon={SettingsIcon}
            />
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default SettingsPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Settings',
    page: ['settings'],
  },
})
