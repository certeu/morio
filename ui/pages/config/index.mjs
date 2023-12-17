import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { ConfigurationWizard } from 'components/config/wizard.mjs'

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div className="py-12 px-4">
        <h1 className="text-center">{props.title}</h1>
        <ConfigurationWizard preloadView="morio" />
      </div>
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
