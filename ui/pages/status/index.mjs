// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'
import { Docker, Traefik, RedPandaConsole } from 'components/brands.mjs'
import { StorageIcon } from 'components/icons.mjs'

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
              title="Status Logs"
              href="/status/logs"
              desc="The status logs are provided by Morio Core and give insight in what is happening behind the scenes."
              width="w-full"
              Icon={StorageIcon}
            />
            <Card
              title="Traefik Dashboard"
              target="_blank"
              href={`/dashboard/?cache_bust=${Date.now()}#/`}
              desc="Display Morio's HTTP microservices, their status, configuration, and availability."
              width="w-full"
              Icon={Traefik}
            />
            <Card
              title="RedPanda Console"
              target="_blank"
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
