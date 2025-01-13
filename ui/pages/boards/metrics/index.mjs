import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'

const FixmeDashboardsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StatusIcon}>
        <div className="max-w-4xl">
          <Popout fixme>
            <h4>Apologies, but this is a work in progress</h4>
            <p>This page is here to indicate the direction we are going in, but we are not there yet.</p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default FixmeDashboardsPage

export const getStaticProps = () => ({
  props: {
    title: 'Metrics',
    page: ['boards', 'metrics'],
  },
})
