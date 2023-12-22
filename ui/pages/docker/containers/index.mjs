// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Link, PageLink } from 'components/link.mjs'
import { ContainerIcon } from 'components/icons.mjs'
import { DockerRunningContainers, DockerSomeContainers } from 'components/docker/index.mjs'
import { ContentWrapper } from 'pages/docker/index.mjs'

/*
 * React component to display a navigation card
 */
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

/**
 * Helper method to filter out running containers
 *
 * @param {array} data - List of all containers from the API
 * @return {array} notRunning - List of containers not in a running state
 */
const filter = (data) => data.filter((container) => container.State !== 'running')

/*
 * The React component for the page itself
 */
const ContainerPage = (props) => {
  return (
    <PageWrapper {...props} title="Docker / Containers">
      <ContentWrapper {...props} Icon={ContainerIcon} title="Docker Containers">
        <DockerRunningContainers />
        <DockerSomeContainers filter={filter} displayProps={{ title: 'Other containers' }} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerPage

export const getStaticProps = () => ({
  props: {
    page: ['docker', 'containers'],
  },
})
