import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import config from 'ui/morio.json' assert { type: 'json' }
import { Link, PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { ProseLayout as Layout } from 'components/layout/prose.mjs'

const HomePage = (props) => {
  if (config.setup === false)
    return (
      <PageWrapper {...props} layout={Layout}>
        <h1 className="text-center">Welcome to Morio</h1>
        <h3 className="text-center">Morio requires an initial configuration file</h3>

        <div className="grid gap-2 mb-4 mt-4">
          <Link className="btn btn-primary btn-lg" href="/setup/wizard">
            Use the configuration wizard
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link className="btn btn-primary btn-outline" href="/setup/upload">
            Upload a configuration file
          </Link>
          <Link className="btn btn-primary btn-outline" href="/setup/download">
            Download a configuration file
          </Link>
        </div>
        <Link className="btn btn-ghost w-full mt-4" href="/setup/api">
          Use the API
        </Link>
      </PageWrapper>
    )

  return (
    <PageWrapper {...props} layout={Layout}>
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
    title: 'Welcome to morio',
    page: [''],
  },
})
