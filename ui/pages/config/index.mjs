import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}></ContentWrapper>
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
