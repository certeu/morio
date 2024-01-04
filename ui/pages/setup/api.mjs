// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { Popout } from 'components/popout.mjs'

const ConfigUploadPage = (props) => (
  <PageWrapper {...props} layout={SplashLayout}>
    <div className="py-12 px-4 max-w-xl m-auto">
      <h1 className="text-center">{props.title}</h1>
      <p className="text-center">
        You can configure Morio entirely through the API.
        <br />
        Refer to <b>the relevant documentation</b> for more info.
      </p>
      <Popout fixme>Write this documentation, then add a link to it.</Popout>
    </div>
  </PageWrapper>
)

export default ConfigUploadPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio API Setup',
    page: ['setup', 'api'],
  },
})
