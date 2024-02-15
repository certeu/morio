import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { SettingsIcon, DocumentIcon, CheckCircleIcon, WrenchIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const SettingsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={SettingsIcon}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title={<span>Show Settings</span>}
              href="/settings/show"
              desc="Display the currently running Morio configuration, including services and container configurations."
              width="w-full"
              Icon={DocumentIcon}
            />
            <Card
              title={<span>Show Presets</span>}
              href="/settings/presets"
              desc="Display the current values of the various environment variables you can use to configure Morio."
              width="w-full"
              Icon={CheckCircleIcon}
            />
            <Card
              title={<span>Update Settings</span>}
              href="/settings/wizard"
              desc="Change Morio settings. Will not cause any changes to running services, until you apply the new settings."
              width="w-full"
              Icon={WrenchIcon}
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
