// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink } from 'components/link.mjs'
import { ComponentIcon, CertificateIcon } from 'components/icons.mjs'
import { Traefik } from 'components/brands.mjs'
import { Card } from 'components/card.mjs'

const ComponentsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ComponentIcon} title={props.title}>
        <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch max-w-4xl">
          <Card
            title={<span>Step-CA <small className="italic text-sm">Certificate Authority</small></span>}
            href="/components/ca"
            desc="Step-CA provides a certicate authority from which Morio can provision certificates in an automated way."
            width="w-full"
            Icon={CertificateIcon}
          />
          <Card
            title={<span>Traefik <small className="italic text-sm">Reverse Proxy</small></span>}
            href="/components/traefik"
            desc="Traefik provides reverse proxying, load balancing, and TLS termination for Morio's HTTP-based microservices."
            width="w-full"
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
