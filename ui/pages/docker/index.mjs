// Dependencies
import { capitalize } from 'lib/utils.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { Link, PageLink } from 'components/link.mjs'
import { Card } from 'components/card.mjs'
import {
  ContainerIcon,
  ContainerImageIcon,
  LayersIcon,
  ServersIcon,
  StatusIcon,
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
            href="/docker/containers"
            desc="See which containers are running, or not running, start and stop containers, or inspect them."
            Icon={ContainerIcon}
          />
          <Card
            href="/docker/images"
            title="Images"
            desc="See which container images are availabe, pull new images, or purge the image cache."
            Icon={ContainerImageIcon}
          />
          <Card
            href="/docker/networks"
            title="Networks"
            desc="Inspect the Docker networking stack, list containers internal IP addresses, and more."
            Icon={WifiIcon}
          />
          <Card
            href="/docker/nodes"
            title="Nodes"
            desc="Inspect the Docker networking stack, list containers internal IP addresses, and more."
            Icon={ServersIcon}
          />
          <Card
            href="/docker/services"
            title="Services"
            desc="Inspect the Docker networking stack, list containers internal IP addresses, and more."
            Icon={LayersIcon}
          />
          <Card
            href="/docker/tasks"
            title="Tasks"
            desc="Inspect the Docker networking stack, list containers internal IP addresses, and more."
            Icon={TaskIcon}
          />
          <Card
            href="/docker/volumes"
            title="Volumes"
            desc="Inspect the Docker networking stack, list containers internal IP addresses, and more."
            Icon={StorageIcon}
          />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatusPage

export const getStaticProps = () => ({
  props: {
    page: ['docker'],
  },
})
