import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { ConfigurationWizard, viewAsConfigPath } from 'components/config/wizard.mjs'

const prefix = '/config'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicConfigurationWizard = dynamic(
  () => import('components/config/wizard.mjs').then((mod) => mod.ConfigurationWizard),
  { ssr: false }
)

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <DynamicConfigurationWizard preloadView={props.view} splash={false} prefix={prefix} />
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = ({ params }) => ({
  props: {
    title: 'Morio Configuration',
    view: params.wizard.join('.'),
    page: ['config', ...params.wizard],
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
