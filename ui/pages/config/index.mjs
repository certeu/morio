import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ConfigurationIcon, DocumentIcon, CheckCircleIcon, WrenchIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ConfigurationIcon}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title={<span>Show Configuration</span>}
              href="/config/show"
              desc="Display the currently running Morio configuration, including services and container configurations."
              width="w-full"
              Icon={DocumentIcon}
            />
            <Card
              title={<span>Show Presets</span>}
              href="/config/presets"
              desc="Display the current values of the various environment variables you can use to configure Morio."
              width="w-full"
              Icon={CheckCircleIcon}
            />
            <Card
              title={<span>Update Configuration</span>}
              href="/config/wizard"
              desc="Change the Morio configuration. Will cause a restart of services if the changes require it."
              width="w-full"
              Icon={WrenchIcon}
            />
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Configuration',
    page: ['config'],
  },
})
