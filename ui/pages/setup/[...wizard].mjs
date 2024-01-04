import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicConfigurationWizard = dynamic(
  () => import('components/config/wizard.mjs').then((mod) => mod.ConfigurationWizard),
  { ssr: false }
)

const ConfigWizardPage = (props) => {
  return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div className="py-12 px-4">
        <h1 className="text-center">{props.title}</h1>
        <DynamicConfigurationWizard
          initialSetup
          preloadView="morio/node_count"
          splash
          prefix="/setup/wizard"
        />
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

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
