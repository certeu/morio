// Dependencies
import { capitalize } from 'lib/utils.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { Link, PageLink } from 'components/link.mjs'
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

export const ContentWrapper = ({ page, title, Icon, children = null, iconAsIs }) => (
  <div className="p-8 w-full">
    <Breadcrumbs page={page} />
    <div className="w-full">
      <h1 className="capitalize flex max-w-4xl justify-between">
        {title}
        {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
      </h1>
      {children}
    </div>
  </div>
)

const Card = ({ title, desc, href, Icon = null }) => (
  <Link
    className="w-72 border px-4 pb-4 rounded shadow hover:bg-secondary hover:bg-opacity-20 flex flex-col"
    href={href}
    title={title}
  >
    <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between">
      {title}
      <Icon className="w-8 h-8 shrink-0 grow-0" />
    </h3>
    <p className="grow">{desc}</p>
  </Link>
)

const StatusPage = (props) => {
  return (
    <PageWrapper {...props} title="Docker">
      <ContentWrapper {...props} Icon={Docker} title="Docker">
        <div className="flex flex-row flex-wrap gap-4 items-center justify-stretch items-stretch max-w-4xl">
          <DockerVersion />
          <DockerInfo />
          <DockerDf />
        </div>
        <h2>Storage</h2>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch max-w-4xl">
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
