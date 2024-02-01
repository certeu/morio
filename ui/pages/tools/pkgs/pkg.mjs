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
            <h3>This is not supported</h3>
            <p>
              I am not even certain that we will ever support this,
              as Apple is notoriously developer-hostile.
            </p>
            <p>
              Still, I added this placeholder page just in case.
            </p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default RpmPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Apple client builder',
    page: ['tools', 'pkgs', 'pkg'],
  },
})
