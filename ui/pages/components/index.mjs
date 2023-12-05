import { PageWrapper } from 'components/layout/page-wrapper.mjs'

const ComponentsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <p>This is a work-in-progress</p>
    </PageWrapper>
  )
}

export default ComponentsPage

export const getStaticProps = () => ({
  props: {
    title: "Components",
    page: ['components']
  }
})
