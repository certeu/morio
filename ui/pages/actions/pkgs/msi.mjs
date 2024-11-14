// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { RedHat } from 'components/brands.mjs'
import { Popout } from 'components/popout.mjs'

const RpmPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={RedHat} title={props.title}>
        <div className="max-w-lg">
          <Popout comment by="joost">
            <h3>This is not yet supported</h3>
            <p>I fully plan to support this, I just have not gotten around to it.</p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default RpmPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Windows client builder',
    page: ['tools', 'pkgs', 'msi'],
  },
})
