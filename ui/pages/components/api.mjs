// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { WebLink } from 'components/link.mjs'
import { CodeIcon } from 'components/icons.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const ApiPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={CodeIcon} title={props.title}>
      <div className="max-w-4xl">
        <Tabs tabs="About, Documentation">
          <Tab key="About">
            <h2>About the Morio Operator API</h2>
            <p className="max-w-prose">
              Morio provides a REST API to facilitate operational management of your Morio
              deployments.
            </p>
            <p className="max-w-prose">
              It includes endpoints for initial setup and deployment of your Morio instances, as
              well as endpoints to facilitate monitoring, observability, and devops workflows.
            </p>
          </Tab>
          <Tab key="Documentation">
            <h2>API Documentation</h2>
            <p className="max-w-prose">
              The Morio Operator API provides{' '}
              <WebLink href="https://swagger.io/specification/">OpenAPI v3</WebLink> compliant
              documentation:
              <br />
              <a href="/ops/api/docs" target="_BLANK" className="btn btn-secondary mt-4">
                Open API Documentation
              </a>
            </p>
          </Tab>
        </Tabs>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ApiPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Operator API',
    page: ['components', 'api'],
  },
})
