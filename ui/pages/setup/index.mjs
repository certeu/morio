import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicSetupWizard = dynamic(
  () => import('components/settings/setup.mjs').then((mod) => mod.SetupWizard),
  { ssr: false }
)

const ConfigWizardPage = (props) => {
  return (
    <PageWrapper {...props} layout={SplashLayout} header={false} footer={false}>
      <div className="py-12 px-4">
        <h1 className="text-center">{props.title}</h1>
        <DynamicSetupWizard />
      </div>
    </PageWrapper>
  )
}

export default ConfigWizardPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Setup Wizard',
    page: ['setup'],
  },
})
