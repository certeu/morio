import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicSettingsWizard = dynamic(
  () => import('components/settings/wizard.mjs').then((mod) => mod.SettingsWizard),
  { ssr: false }
)

const SettingsPage = (props) => {
  return (
    <PageWrapper {...props} role="operator">
      <DynamicSettingsWizard preloadView={props.view} page={props.page} />
    </PageWrapper>
  )
}

export default SettingsPage

export const getStaticProps = ({ params }) => ({
  props: {
    title: 'Update Settings',
    view: params.wizard.join('.'),
    page: ['settings', ...params.wizard],
  },
})

export const getStaticPaths = () => ({
  paths: [
    '/settings/wizard/',
    '/settings/start/',
    '/settings/validate',
    '/settings/connector/',
    '/settings/connector/inputs/',
    '/settings/connector/outputs/',
    '/settings/connector/pipelines/',
    '/settings/deployment/',
    '/settings/deployment/setup/',
    '/settings/metadata/',
    '/settings/metadata/comment/',
    '/settings/tokens/',
    '/settings/tokens/secrets/',
    '/settings/tokens/variables/',
  ],
  fallback: 'blocking',
})
