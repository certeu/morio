import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout} from 'components/layout/splash.mjs'
import { ConfigurationWizard } from 'components/setup/wizard.mjs'

const ConfigWizardPage = (props) => {

  return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div>
        <h1>Configure Morio</h1>
        <ConfigurationWizard />
      </div>
    </PageWrapper>
  )
}

export default ConfigWizardPage

export const getStaticProps = () => ({
  props: {
    title: "Morio Configuration Wizard",
    page: ['setup', 'wizard']
  }
})
