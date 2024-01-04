// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink } from 'components/link.mjs'
import { CodeIcon, MorioIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ApisPage = (props) => {
  return (
    <PageWrapper {...props} title="Docker">
      <ContentWrapper {...props} Icon={CodeIcon} title={props.title}>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch max-w-4xl">
          <Card
            title="Morio"
            href="/apis/morio"
            desc="Morio's own management API allows you to configure your Morio instance or cluster."
            width="w-1/2"
            Icon={MorioIcon}
          />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ApisPage

export const getStaticProps = () => ({
  props: {
    title: 'APIs',
    page: ['apis'],
  },
})
