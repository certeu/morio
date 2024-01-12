// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { StatusIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'

const StatusPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StatusIcon} title={props.title}>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch max-w-4xl">
          <Popout fixme>This is a work in progress</Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatusPage

export const getStaticProps = () => ({
  props: {
    title: 'Status',
    page: ['status'],
  },
})
