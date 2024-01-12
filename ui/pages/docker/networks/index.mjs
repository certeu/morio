// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { WifiIcon } from 'components/icons.mjs'
import { DockerNetworks } from 'components/docker/index.mjs'

/*
 * The React component for the page itself
 */
const ContainerImagePage = (props) => {
  return (
    <PageWrapper {...props} title="Docker / Networks">
      <ContentWrapper {...props} Icon={WifiIcon} title="Docker Networks">
        <DockerNetworks />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerImagePage

export const getStaticProps = () => ({
  props: {
    page: ['docker', 'networks'],
  },
})
