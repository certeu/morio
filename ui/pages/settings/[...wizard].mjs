import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'

const prefix = '/config'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicSettingsWizard = dynamic(
  () => import('components/settings/wizard.mjs').then((mod) => mod.SettingsWizard),
  { ssr: false }
)

const SettingsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <DynamicSettingsWizard
        preloadView={props.view}
        splash={false}
        prefix={prefix}
        page={props.page}
      />
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
  paths: [],
  fallback: 'blocking',
})
