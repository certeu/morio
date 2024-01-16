// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink } from 'components/link.mjs'
import { RedPanda } from 'components/brands.mjs'
import { Popout } from 'components/popout.mjs'

const BrokerPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={RedPanda} title={props.title}>
        <div className="max-w-prose">
          <p>
            The (fast) beating heart of a Morio deployment is RedPanda. It is a
            streaming data platform that is API-compatible with Apache Kafka, yet
            is easier to maintain and operate.
          </p>
          <p>
            In streaming parlor, a single instance is called a <em>broker</em> so
            we utilize the same terminology to refer to this component in a Morio
            deployment.
          </p>
          <Popout related>
            <h4>Learn more about brokers with Console</h4>
            <PageLink href="/components/console">The console</PageLink> provides a look under the hood
            of your running broker
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default BrokerPage

export const getStaticProps = () => ({
  props: {
    title: 'Broker',
    page: ['components', 'broker'],
  },
})
