// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { DesktopIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'

const UiPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={DesktopIcon} title={props.title}>
        <p className="max-w-prose">
          The Morio Web Interface, or <b>ui</b>, provides a web intefaces to the Morio Operator API,
          as well as providing status and monitoring info, as well as (some) documenation.
        </p>
        <div className="max-w-prose">
          <Popout note>
            <h5>This is an optional component</h5>
            <p>
              You can elect to run Morio in <em>headless</em> mode, in which case the Morio Web
              Interface will be enabled.
            </p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default UiPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Web Interface',
    page: ['components', 'core'],
  },
})
