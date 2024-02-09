import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { useState } from 'react'
import { WideIcon, NarrowIcon } from 'components/icons.mjs'

const ToggleIcon = ({ wide, setWide }) => (
  <button className="" onClick={() => setWide(!wide)} title="Toggle wide/narrow layout">
    {wide ? <WideIcon className="w-12 h-12" /> : <NarrowIcon className="w-12 h-12" />}
  </button>
)

export const MDXWrapper = ({ pageProps, filePath, children }) => {
  const crumbs = filePath.split('/').slice(1, -1)
  const [wide, setWide] = useState(false)

  return (
    <PageWrapper page={crumbs} title={`Documentation - ${pageProps.frontmatter?.title}}`}>
      <ContentWrapper
        page={crumbs}
        title={pageProps.frontmatter.title}
        Icon={<ToggleIcon {...{ wide, setWide }} />}
      >
        {wide ? (
          children
        ) : (
          <div className="mdx max-w-4xl mx-auto">
            <div className="mdx max-w-prose">{children}</div>
          </div>
        )}
      </ContentWrapper>
    </PageWrapper>
  )
}
