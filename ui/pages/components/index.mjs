// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink } from 'components/link.mjs'
import { ComponentIcon } from 'components/icons.mjs'
import { Traefik } from 'components/brands.mjs'
import { Card } from 'components/card.mjs'

const ComponentsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ComponentIcon} title={props.title}>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch max-w-4xl">
          <Card
            title="Traefik"
            href="/components/traefik"
            desc="Traefik provides reverse proxying, load balancing, and TLS termination for Morio's HTTP-based microservices."
            width="w-1/2"
            Icon={Traefik}
          />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ComponentsPage

export const getStaticProps = () => ({
  props: {
    title: 'Components',
    page: ['components'],
  },
})
