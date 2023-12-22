// Dependencies
import { formatContainerName } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContainerIcon } from 'components/icons.mjs'
import { DockerContainer } from 'components/docker/index.mjs'
import { ContentWrapper } from 'pages/docker/index.mjs'
import { Spinner } from 'components/animations.mjs'

const ContainerPage = ({ page, id }) => {
  /*
   * State for holding the name which will be set via
   * the getData call from the DockerContainer component
   */
  const [name, setName] = useState(false)

  /*
   * getData is a way to pull the API data from the component
   */
  const getData = (data) => setName(formatContainerName(data.Name))

  return (
    <PageWrapper page={page}>
      <ContentWrapper
        page={page}
        Icon={name ? ContainerIcon : <Spinner className="w-16 h-16 animate-spin" />}
        title={name ? name : 'One moment please...'}
      >
        <div className="max-w-4xl">
          <DockerContainer {...{ id, getData }} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerPage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['docker', 'containers', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
