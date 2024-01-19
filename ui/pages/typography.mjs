// Components
import { BoolNoIcon, BoolYesIcon } from 'components/icons.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { WebLink } from 'components/link.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext } from 'react'

// Re-use this
const p = (
  <p>
    This paragraph is here to show the vertical spacing between headings and paragraphs. In
    addition, let&apos;s <WebLink href="#">make it a bit longer</WebLink> so we can see the line
    height as the text wraps.
  </p>
)

const TypographyPage = (props) => {
  const { setLoadingStatus, loading, LoadingProgress } = useContext(LoadingStatusContext)

  const loadingProgression = () => {
    let delay = 0
    for (let i = 1; i < 51; i++) {
      delay += 25
      window.setTimeout(
        () =>
          setLoadingStatus(
            i === 50
              ? [true, 'All done!', true, true]
              : [true, <LoadingProgress key={i} val={i} max={50} msg={`Herding cats: ${i}/50`} />]
          ),
        delay
      )
    }
  }

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="text-primary mdx max-w-prose text-base-content max-w-prose text-base xl:pl-4">
          <p>
            This temporary hom page shows an overview of different elements and how they are styled.
          </p>
          <p>It&apos;s a good starting point for theme development.</p>
          <h2>Headings (this is h2)</h2>
          {p} {p}
          <h3>This is h3</h3>
          {p} {p}
          <h4>This is h4</h4>
          {p} {p}
          <h5>This is h5</h5>
          {p} {p}
          <h6>This is h6</h6>
          {p} {p}
          <h2>Links and buttons</h2>
          <p>
            A regular link <a href="#">looks like this</a>, whereas buttons look like this:
          </p>
          <h3>Main button styles</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className="btn btn-neutral">Neutral button</button>
            <button className="btn btn-primary">Primary button</button>
            <button className="btn btn-secondary">Secondary button</button>
            <button className="btn btn-accent">Accent button</button>
          </div>
          <h3>State button styles</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className="btn btn-info">Info button</button>
            <button className="btn btn-success">Success button</button>
            <button className="btn btn-warning">Warning button</button>
            <button className="btn btn-error">Error button</button>
          </div>
          <h3>Other button styles</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className="btn btn-ghost">Ghost button</button>
            <button className="btn btn-link">Link button</button>
          </div>
          <h3>Outlined button styles</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className="btn btn-outline btn-neutral">Neutral button</button>
            <button className="btn btn-outline btn-primary">Primary button</button>
            <button className="btn btn-outline btn-secondary">Secondary button</button>
            <button className="btn btn-outline btn-accent">Accent button</button>
          </div>
          <h3>Button sizes</h3>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className="btn btn-primary btn-lg">Large</button>
            <button className="btn btn-primary">Normal</button>
            <button className="btn btn-primary btn-sm">Small</button>
            <button className="btn btn-primary btn-xs">Tiny</button>
            <button className="btn btn-primary btn-lg btn-wide">Large wide</button>
            <button className="btn btn-primary btn-wide">Normal wide</button>
            <button className="btn btn-primary btn-sm btn-wide">Small wide</button>
            <button className="btn btn-primary btn-xs bnt-wide">Tiny wide</button>
          </div>
          <h2>Popouts</h2>
          <p>The Popout component allows you to make something stand out in various ways.</p>
          <h3>No specific style</h3>
          <h4 className="capitalize">Regular</h4>
          <Popout>
            <h5>I am the a title</h5>
            {p}
          </Popout>
          <h4 className="capitalize">Compact</h4>
          <Popout compact>I am compact</Popout>
          {[
            'comment',
            'error',
            'fixme',
            'important',
            'link',
            'note',
            'related',
            'tip',
            'tldr',
            'warning',
          ].map((type) => {
            const props = {}
            props[type] = true
            return (
              <div key={type}>
                <h3 className="capitalize">{type}</h3>
                <h4 className="capitalize">Regular {type}</h4>
                <Popout {...props} by="joost">
                  <h5>I am the {type} title</h5>
                  {p}
                </Popout>
                <h4 className="capitalize">Compact {type}</h4>
                <Popout {...props} compact>
                  I am <b>{type}</b> + compact
                </Popout>
              </div>
            )
          })}
          <h2>Loading state</h2>
          <p className="flex flex-row items-center flex-wrap gap-2">
            Loading: {loading ? <BoolYesIcon /> : <BoolNoIcon />}
          </p>
          <div className="flex flex-row flex-wrap gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setLoadingStatus([true, 'Contacting Backend'])}
            >
              Start loading
            </button>
            <button
              className="btn btn-success"
              onClick={() => setLoadingStatus([true, 'Nailed It', true, true])}
            >
              Stop loading, success
            </button>
            <button
              className="btn btn-error"
              onClick={() => setLoadingStatus([true, 'Backend Problem', true, false])}
            >
              Stop loading, failure
            </button>
            <button className="btn btn-neutral" onClick={() => setLoadingStatus([false])}>
              Stop loading, abruptly
            </button>
            <button className="btn btn-accent" onClick={() => loadingProgression()}>
              Show loading progression
            </button>
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default TypographyPage

export const getStaticProps = () => ({
  props: {
    title: 'Typography',
    page: ['typography'],
  },
})
