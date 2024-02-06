// Dependencies
import { formatContainerName } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ContainerImageIcon } from 'components/icons.mjs'
import { DockerImage, DockerImageLayers } from 'components/docker/index.mjs'

const ContainerImagePage = (props) => {
  /*
   * React state
   */
  const [data, setData] = useState(false)

  return (
    <PageWrapper page={props.page}>
      <ContentWrapper
        {...props}
        Icon={ContainerImageIcon}
        title={data ? formatContainerName(data.RepoTags[0]) : 'One moment please...'}
      >
        <div className="max-w-4xl">
          <DockerImage {...{ id: props.id, callback: setData }} />
          <DockerImageLayers id={props.id} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerImagePage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['status', 'docker', 'images', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
