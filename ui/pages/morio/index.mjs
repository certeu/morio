import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { MorioIcon } from 'components/icons.mjs'

const MorioPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={MorioIcon} title={props.title}>
      <div className="max-w-2xl">
        <Popout note>
          <h5>There is nothing here</h5>
          <p>This is not the URL you are looking for</p>
        </Popout>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default MorioPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio',
    page: ['morio'],
  },
})
