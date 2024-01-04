// Dependencies
import { formatContainerName } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { WifiIcon } from 'components/icons.mjs'
import { DockerNetwork } from 'components/docker/index.mjs'
import { Spinner } from 'components/animations.mjs'

const DockerNetworkPage = (props) => {
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
      <ContentWrapper {...props} Icon={WifiIcon} title={data ? data.Name : 'One moment please...'}>
        <div className="max-w-4xl">
          <DockerNetwork {...{ id: props.id, callback: setData, reload }} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DockerNetworkPage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['docker', 'networks', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
