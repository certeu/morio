// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Link, PageLink } from 'components/link.mjs'
import { ContainerIcon } from 'components/icons.mjs'
import { DockerRunningContainers, DockerSomeContainers } from 'components/docker/index.mjs'

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
