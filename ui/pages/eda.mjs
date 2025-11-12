// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { Link } from 'components/link.mjs'

const EdaPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="text-primary mdx max-w-prose text-base-content max-w-prose text-base xl:pl-4">
          <Popout note>
            <h5>Event-driven Automation (EdA) is disabled</h5>
            <p>
              To enabled automation inside Morio, set the <code>ENABLE_SERVICE_EDA</code> feature
              flag in <Link href="/settings/tokens/flags">your settings</Link>.
            </p>
            <p className="text-sm mt-0">Once enabled, this URL will load the automation view.</p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default EdaPage

export const getStaticProps = () => ({
  props: {
    title: 'Event-driven Automation (EdA)',
    page: ['eda'],
  },
})
