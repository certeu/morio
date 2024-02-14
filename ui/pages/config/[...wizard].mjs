import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'

const prefix = '/config'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicConfigurationWizard = dynamic(
  () => import('components/mconfig/config-wizard.mjs').then((mod) => mod.ConfigWizard),
  { ssr: false }
)

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <DynamicConfigurationWizard
        preloadView={props.view}
        splash={false}
        prefix={prefix}
        page={props.page}
      />
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = ({ params }) => ({
  props: {
    title: 'Update Configuration',
    view: params.wizard.join('.'),
    page: ['config', ...params.wizard],
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
