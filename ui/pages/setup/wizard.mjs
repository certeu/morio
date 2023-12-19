import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { ConfigurationWizard } from 'components/config/wizard.mjs'

const ConfigWizardPage = (props) => {
  return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div className="py-12 px-4">
        <h1 className="text-center">Configure Morio</h1>
        <ConfigurationWizard initialSetup preloadView="morio.node_count" splash />
      </div>
    </PageWrapper>
  )
}

export default ConfigWizardPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Configuration Wizard',
    page: ['setup', 'wizard'],
  },
})
