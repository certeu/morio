import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'

const AboutPage = (props) => {
  return (
  <PageWrapper {...props}>
    <ContentWrapper {...props}>
      <p>
        Morio is a state-of-the-art observability platform
        based on streaming data, with a focus on resilience,
        flexibility, maintainability, and automation.
      </p>
      <p>To learn more, refer to:</p>
      <ul className="list list-disc ml-8">
        <li>The Morio documentation on <a href="https://morio.it/">morio.it</a></li>
        <li>The Morio source code at <a href="https://github.com/certeu/morio">github.com/certeu/morio</a></li>
      </ul>
    </ContentWrapper>
  </PageWrapper>
)
}
export default AboutPage

export const getStaticProps = () => ({
  props: {
    title: 'About Morio',
    page: ['about'],
  },
})
