// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { RedPandaConsole } from 'components/brands.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const ConsolePage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={RedPandaConsole} title={props.title}>
        <div className="max-w-4xl">
          <Tabs tabs="About, Console">
            <Tab key="About">
              <h2>About the RedPanda Console</h2>
              <p className="max-w-prose">
                The (Redpanda) Console is a web-based UI for managing Redpanda brokers.
              </p>
              <p className="max-w-prose">
                Console provides visibility into your streaming data and management of your topics, consumer groups, and access control.
              </p>
            </Tab>
            <Tab key="Console">
              <h2>RedPanda Console</h2>
              <p className="max-w-prose">
                The Console is available at the link below:
                <br />
                <a
                  href={`/console?cache_bust=${Date.now()}`}
                  target="_BLANK"
                  className="btn btn-secondary mt-4"
                >
                  Open RedPanda Console
                </a>
              </p>
            </Tab>
          </Tabs>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ConsolePage

export const getStaticProps = () => ({
  props: {
    title: 'Console',
    page: ['components', 'console'],
  },
})
