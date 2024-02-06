// Dependencies
import { formatContainerName } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContainerIcon } from 'components/icons.mjs'
import {
  DockerContainer,
  ContainerStateActions,
  ContainerTroubleshootActions,
  ContainerExpertActions,
} from 'components/docker/index.mjs'
import { Spinner } from 'components/animations.mjs'
import { MainSideView } from 'components/layout/main-side-view.mjs'

const ContainerPage = ({ page, id }) => {
  /*
   * React state
   */
  const [data, setData] = useState(false)
  const [reload, setReload] = useState(0)

  /*
   * Method that will force a reload
   */
  const forceReload = () => setReload(reload + 1)

  /*
   * Props for the side components
   */
  const sideProps = {
    data,
    methods: { callback: setData, forceReload },
  }

  /*
   * Side component
   */
  const side = data ? (
    <>
      <div className="flex flex-col gap-2 w-full items-stretch p-4">
        <h5>Change Status</h5>
        <ContainerStateActions {...sideProps} />
        <h5 className="mt-4">Troubleshoot</h5>
        <ContainerTroubleshootActions {...sideProps} />
        <h5 className="mt-4">Expert Mode</h5>
        <ContainerExpertActions {...sideProps} />
      </div>
    </>
  ) : null

  return (
    <PageWrapper page={page}>
      <MainSideView
        side={side}
        sideTitle="Container actions"
        page={page}
        Icon={data.Name ? ContainerIcon : <Spinner className="w-16 h-16 animate-spin" />}
        title={data ? formatContainerName(data.Name) : 'One moment please...'}
      >
        <DockerContainer {...{ id, callback: setData, reload }} />
      </MainSideView>
    </PageWrapper>
  )
}

export default ContainerPage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['status', 'docker', 'containers', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
