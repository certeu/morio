// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import {
  CertificateIcon,
  CodeIcon,
  ComponentIcon,
  DesktopIcon,
  MorioIcon,
} from 'components/icons.mjs'
import { RedPanda, RedPandaConsole, Traefik } from 'components/brands.mjs'
import { Card } from 'components/card.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { Popout } from 'components/popout.mjs'

const components = {
  api: (
    <Card
      title={<span>API</span>}
      href="/components/api"
      desc="As an API-first project, Morio can be fully deployed, configured, and managed through its API."
      width="w-full"
      Icon={CodeIcon}
    />
  ),
  broker: (
    <Card
      title={
        <span>
          Broker <small className="italic text-sm">( RedPanda )</small>
        </span>
      }
      href="/components/broker"
      desc="Morio is a streaming data platform, and RedPanda provides those streaming capabilities."
      width="w-full"
      Icon={RedPanda}
    />
  ),
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
  console: (
    <Card
      title={
        <span>
          Console <small className="italic text-sm">( RedPanda Console )</small>
        </span>
      }
      href="/components/broker"
      desc="The console provides a live view into the heart of Morio's streaming data platform."
      width="w-full"
      Icon={RedPandaConsole}
    />
  ),
  core: (
    <Card
      title={<span>Core</span>}
      href="/components/core"
      desc="Morio Core provides orchestration and configuration services that all other Morio components rely on."
      width="w-full"
      Icon={MorioIcon}
    />
  ),
  proxy: (
    <Card
      title={
        <span>
          Proxy <small className="italic text-sm">( Traefik )</small>
        </span>
      }
      href="/components/proxy"
      desc="Morio leverages Traefik for reverse proxying, load balancing, and TLS termination for microservices."
      width="w-full"
      Icon={Traefik}
    />
  ),
  ui: (
    <Card
      title={<span>Web Interface</span>}
      href="/components/api"
      desc="The Morio web interface puts a friendly face on the API and various components of a Morio deployment."
      width="w-full"
      Icon={DesktopIcon}
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
                {components.api}
                {components.broker}
                {components.ca}
                {components.core}
                {components.proxy}
              </div>
            </Tab>
            <Tab key="Optional Components">
              <p>
                Once set up, the following components are optional and can be added to Morio at your
                discretion:
              </p>
              <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
                {components.console}
                {components.ui}
              </div>
            </Tab>
            <Tab key="Ephemeral Components">
              <p>
                When Morio runs in <em>ephemeral mode</em>, the following components will be active:
              </p>
              <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
                {components.api}
                {components.core}
                {components.proxy}
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
