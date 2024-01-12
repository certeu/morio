// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ComponentIcon, CertificateIcon, MorioIcon, CodeIcon } from 'components/icons.mjs'
import { Traefik } from 'components/brands.mjs'
import { Card } from 'components/card.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { Popout } from 'components/popout.mjs'

const components = {
  ca: (
    <Card
      title={
        <span>
          Certificate Authority <small className="italic text-sm">( SmallStep )</small>
        </span>
      }
      href="/components/ca"
      desc="Morio's on-board certificate authority facilitates fully-automated provisioning of X509 certificates."
      width="w-full"
      Icon={CertificateIcon}
    />
  ),
  core: (
    <Card
      title={<span>Morio Core</span>}
      href="/components/core"
      desc="Morio Core provides orchestration and configuration services that all other Morio components rely on."
      width="w-full"
      Icon={MorioIcon}
    />
  ),
  traefik: (
    <Card
      title={
        <span>
          Load Balancer <small className="italic text-sm">( Traefik )</small>
        </span>
      }
      href="/components/traefik"
      desc="Morio leverages Traefik for reverse proxying, load balancing, and TLS termination for microservices."
      width="w-full"
      Icon={Traefik}
    />
  ),
  api: (
    <Card
      title={<span>Operator API</span>}
      href="/components/api"
      desc="Morio is an API-first project and can be fully deployed, configured, and managed through its operator API."
      width="w-full"
      Icon={CodeIcon}
    />
  ),
  ui: (
    <Card
      title={<span>Web Interface</span>}
      href="/components/api"
      desc="Morio is an API-first project and can be fully deployed, configured, and managed through its operator API."
      width="w-full"
      Icon={CodeIcon}
    />
  ),
}

const ComponentsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ComponentIcon} title={props.title}>
        <div className="max-w-4xl">
          <Tabs tabs="Core Components, Optional Components, Ephemeral Components">
            <Tab key="Core Components">
              <p>Once set up, the following components are required for Morio to function:</p>
              <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
                {components.ca}
                {components.traefik}
                {components.core}
                {components.api}
              </div>
            </Tab>
            <Tab key="Optional Components">
              <p>
                Once set up, the following components are optional and can be added to Morio at your
                discretion:
              </p>
              <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
                {components.ui}
              </div>
            </Tab>
            <Tab key="Ephemeral Components">
              <p>
                When Morio runs in <em>ephemeral mode</em>, the following components will be active:
              </p>
              <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
                {components.traefik}
                {components.core}
                {components.api}
                {components.ui}
              </div>
              <Popout note compact>
                A Morio instance runs in <em>Ephemeral mode</em> until you deploy an initial
                configuration
              </Popout>
            </Tab>
          </Tabs>
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
