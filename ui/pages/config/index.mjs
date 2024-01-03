import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { ConfigurationWizard } from 'components/config/wizard.mjs'

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ConfigurationWizard preloadView="morio/node_count" splash={false} prefix="/config" />
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
