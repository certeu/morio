// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { Card } from 'components/card.mjs'
import { Docker, Traefik, RedPandaConsole } from 'components/brands.mjs'
import { CodeIcon } from 'components/icons.mjs'

const StatusPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StatusIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title="Docker"
              href="/status/docker"
              desc="Display running containers, available images, swarm state, or start and stop containers."
              width="w-full"
              Icon={Docker}
            />
            <Card
              title="Traefik Dashboard"
              href={`/dashboard/?cache_bust=${Date.now()}#/`}
              desc="Display Morio's HTTP microservices, their status, configuration, and availability."
              width="w-full"
              Icon={Traefik}
            />
            <Card
              title="RedPanda Console"
              href="/console/overview"
              desc="Display RedPanda cluster & broker data, and manage their configuration including ACLs."
              width="w-full"
              Icon={RedPandaConsole}
            />
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatusPage

export const getStaticProps = () => ({
  props: {
    title: 'Status',
    page: ['status'],
  },
})
