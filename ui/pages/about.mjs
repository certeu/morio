import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'

const AboutPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props}>
      <Popout warning>
        <h5>This is alpha code</h5>
        <p>Morio is currently under active development, and no official support is available.</p>
        <p>If and when that changes, this page will be updated.</p>
      </Popout>
    </ContentWrapper>
  </PageWrapper>
)

export default AboutPage

export const getStaticProps = () => ({
  props: {
    title: 'About',
    page: ['about'],
  },
})
