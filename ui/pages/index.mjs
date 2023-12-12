import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import config from 'ui/morio.json' assert { type: 'json' }
import { Link, PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { SplashLayout} from 'components/layout/splash.mjs'

const HomePage = (props) => {

  if (config.setup === false) return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div className="text-center">
        <h1>Welcome to Morio</h1>
        <Popout note compact>
          <strong>Morio is uninitialized. Please provide a configuration.</strong>
        </Popout>
        <div className="grid gap-2 mb-2 mt-4">
          <Link className="btn btn-primary btn-lg" href="/setup/wizard">Use the configuration wizard</Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link className="btn btn-primary btn-outline" href="/setup/upload">Upload a configuration file</Link>
          <Link className="btn btn-primary btn-outline" href="/setup/download">Download a configuration file</Link>
        </div>
        <Link className="btn btn-ghost w-full mt-2" href="/setup/api">Use the API</Link>
      </div>
      <Popout tip>
        <h5 className="text-base-content">Note sure what to pick?</h5>
        <div className="text-sm">
        <div className="pb-2">
          <strong>Use the configuration wizard</strong>
          <div className="text-sm -mt-1 italic">
            unless you have a specific reason not to
          </div>
        </div>
        <div className="pb-2">
          <strong>Upload a configuration file</strong>
          <div className="text-sm -mt-1 italic">
            if you received a morio configuration file from a trusted source
          </div>
        </div>
        <div className="pb-2">
          <strong>Download a configuration file</strong>
          <br />
          <div className="text-sm -mt-1 italic">
            if you received a link to a morio configuration file from a trusted source
          </div>
        </div>
        <div className="pb-2">
          <strong>Use the API</strong>
          <div className="text-sm -mt-1 italic">
            if you want to automate the deployment of this morio instance
          </div>
        </div>
        </div>
      </Popout>
    </PageWrapper>
  )

  return (
    <PageWrapper {...props} layout={SplashLayout}>
      <div className="text-center">
        <h1>Welcome to Morio</h1>
        <div className="text-sm flex flex-row gap-2 justify-center mt-4 opacity-70">
          <Spinner /> One moment please, loading configuration...
        </div>
      </div>
    </PageWrapper>
  )
}

export default HomePage

export const getStaticProps = () => ({
  props: {
    title: "Welcome to morio",
    page: ['']
  }
})
