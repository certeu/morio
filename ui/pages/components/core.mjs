import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink, WebLink } from 'components/link.mjs'
import { MorioIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const CorePage = (props) => {

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={MorioIcon} title={props.title}>
        <p className="max-w-prose">
          Morio Core handles orchestration and configuration services for all Morio components.
        </p>
        <p className="max-w-prose">
          It is the only service running with elevated privileges, as it needs to be able to configure the Docker daemon on the Host OS.
        </p>
        <p className="max-w-prose">
          The Core API is not exposed as a service, and is only accessible inside the Docker network.
          However, much of the <PageLink href="/components/api">Operator API</PageLink> functionality is provided
          by Morio Core under the hood.
        </p>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default CorePage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Core',
    page: ['components', 'core'],
  },
})
