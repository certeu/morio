import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink, WebLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { Traefik } from 'components/brands.mjs'

const loading = <p>Loading...</p>

const TraefikPage = (props) => {

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={Traefik} title={props.title}>
        <div className="max-w-4xl">
          <Tabs tabs="About, Dashboard">
            <Tab key="About">
              <h2>About the Morio Load Balancer</h2>
              <p className="max-w-prose">
                Morio utilizes <WebLink href="https://traefik.io/traefik/">Traefik</WebLink>,
                a leading application proxy and load balancer,
                to front its various HTTP-based microservices.
              </p>
              <p className="max-w-prose">
                Morio Core wil set up Traefik, based on the high-level configuration provided.
              </p>
            </Tab>
            <Tab key="Dashboard">
              <h2>Traefik Dashboard</h2>
              <p className="max-w-prose">
                The Traefik dashboard is available at the link below:
                <br />
                <a href="/dashboard/" target="_BLANK" className="btn btn-secondary mt-4">Open Traefik Dashboard</a>
              </p>
            </Tab>
          </Tabs>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default TraefikPage

export const getStaticProps = () => ({
  props: {
    title: 'Load Balancer',
    page: ['components', 'traefik'],
  },
})
