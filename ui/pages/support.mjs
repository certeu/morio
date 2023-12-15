import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { ProseLayout as Layout } from 'components/layout/prose.mjs'

const SupportPage = (props) => (
  <PageWrapper {...props} layout={Layout}>
    <h1>Support</h1>
    <Popout warning>
      <h5>This is alpha code</h5>
      <p>Morio is currently under active development, and no official support is available.</p>
      <p>If and when that changes, this page will be updated.</p>
    </Popout>
  </PageWrapper>
)

export default SupportPage

export const getStaticProps = () => ({
  props: {
    title: 'Support',
    page: ['support'],
  },
})
