import { PageWrapper } from 'components/layout/page-wrapper.mjs'

const MorioApiPage = (props) => {
  return (
    <PageWrapper {...props}>
      <iframe
        src="https://localhost/apis/morio/docs/"
        width="100%"
        height="100%"
        style={{ overflow: 'hidden', height: '100vh', width: '100%' }}
      />
    </PageWrapper>
  )
}

export default MorioApiPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio API',
    page: ['apis', 'morio'],
  },
})
