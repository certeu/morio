// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { WifiIcon } from 'components/icons.mjs'
import { DockerNetwork } from 'components/docker/index.mjs'

const DockerNetworkPage = (props) => {
  /*
   * React state
   */
  const [data, setData] = useState(false)

  return (
    <PageWrapper page={props.page}>
      <ContentWrapper {...props} Icon={WifiIcon} title={data ? data.Name : 'One moment please...'}>
        <div className="max-w-4xl">
          <DockerNetwork {...{ id: props.id, callback: setData }} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DockerNetworkPage

export const getStaticProps = ({ params }) => ({
  props: {
    page: ['status', 'docker', 'networks', params.id],
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
