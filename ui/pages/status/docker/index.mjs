// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Card } from 'components/card.mjs'
import {
  ContainerIcon,
  ContainerImageIcon,
  LayersIcon,
  ServersIcon,
  StorageIcon,
  TaskIcon,
  WifiIcon,
} from 'components/icons.mjs'
import { Docker } from 'components/brands.mjs'
import { DockerInfo, DockerDf, DockerVersion } from 'components/docker/index.mjs'

const StatusPage = (props) => {
  return (
    <PageWrapper {...props} title="Docker">
      <ContentWrapper {...props} Icon={Docker} title="Docker">
        <div className="flex flex-row flex-wrap gap-4 items-center justify-stretch items-stretch max-w-4xl">
          <DockerVersion />
          <DockerInfo />
          <DockerDf />
        </div>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch max-w-4xl mt-4">
          <Card
            title="Containers"
            href="/status/docker/containers"
            desc="List running containers, change their state, or inspect their details."
            Icon={ContainerIcon}
          />
          <Card
            href="/status/docker/images"
            title="Images"
            desc="List available container images, and inspect their details."
            Icon={ContainerImageIcon}
          />
          <Card
            href="/status/docker/networks"
            title="Networks"
            desc="List available Docker networks, and inspect their details."
            Icon={WifiIcon}
          />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatusPage

export const getStaticProps = () => ({
  props: {
    page: ['status', 'docker'],
  },
})
