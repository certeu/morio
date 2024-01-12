// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ContainerIcon } from 'components/icons.mjs'
import { DockerImages } from 'components/docker/index.mjs'

/*
 * The React component for the page itself
 */
const ContainerImagePage = (props) => {
  return (
    <PageWrapper {...props} title="Docker / Images">
      <ContentWrapper {...props} Icon={ContainerIcon} title="Docker Images">
        <DockerImages />
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ContainerImagePage

export const getStaticProps = () => ({
  props: {
    page: ['docker', 'images'],
  },
})
