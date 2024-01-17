// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Traefik } from 'components/brands.mjs'
import { WebLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'

const TraefikPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={Traefik} title={props.title}>
        <div className="max-w-prose">
          <p>
            Morio utilizes <WebLink href="https://traefik.io/traefik/">Traefik</WebLink>, a leading
            application proxy and load balancer, to front its various HTTP-based microservices.
          </p>
          <Popout related>
            <h4>Traefik Dashboard</h4>
            <p>
              The Traefik dashboard is available at the link below:
              <br />
              <a
                href={`/dashboard/?cache_bust=${Date.now()}`}
                target="_BLANK"
                className="btn btn-secondary mt-4"
              >
                Open Traefik Dashboard
              </a>
            </p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default TraefikPage

export const getStaticProps = () => ({
  props: {
    title: 'Proxy',
    page: ['components', 'proxy'],
  },
})
