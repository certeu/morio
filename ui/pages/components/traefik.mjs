import { PageWrapper } from 'components/layout/page-wrapper.mjs'

const TraefikPage = (props) => {
  return (
    <PageWrapper {...props}>
      <iframe
        src={`/dashboard/?cache_bust=${Date.now()}#/`}
        width="100%"
        height="100%"
        style={{ overflow: 'hidden', height: '100vh', width: '100%' }}
      />
    </PageWrapper>
  )
}

export default TraefikPage

export const getStaticProps = () => ({
  props: {
    title: 'Traefik',
    page: ['components', 'traefik'],
  },
})
