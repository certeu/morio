// Dependencies
import { formatContainerName } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ContainerImageIcon } from 'components/icons.mjs'
import { DockerImage, DockerImageHistory } from 'components/docker/index.mjs'
import { Spinner } from 'components/animations.mjs'
import { MainSideView } from 'components/layout/main-side-view.mjs'

const ContainerImagePage = (props) => {
  /*
   * React state
   */
  const [name, setName] = useState(false)
  const [data, setData] = useState(false)
  const [reload, setReload] = useState(0)

  /*
   * Method that will force a reload
   */
  const forceReload = () => setReload(reload + 1)

  return (
    <PageWrapper page={props.page}>
      <ContentWrapper
        {...props}
        Icon={ContainerImageIcon}
        title={data ? formatContainerName(data.RepoTags[0]) : 'One moment please...'}
      >
        <div className="max-w-4xl">
          <DockerImage {...{ id: props.id, callback: setData, reload }} />
          <DockerImageHistory id={props.id} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerImagePage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['docker', 'images', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
