import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import { Link, PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { MorioIcon, WarningIcon, DarkThemeIcon, LightThemeIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'

const Setup = ({ pageProps }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <PageWrapper {...pageProps} layout={SplashLayout} header={false} footer={false}>
      <div className="">
        <div className="flex flex-col justify-center h-screen pb-24 mx-auto max-w-xl">
          <h1 className="flex flex-row gap-2 items-center justify-between">
            <MorioIcon className="w-12 h-12 text-primary" />
            <div className="text-4xl text-center">Welcome to Morio</div>
            <button onClick={toggleTheme} title="Switch between dark and light mode">
              {theme === 'dark' ? (
                <LightThemeIcon className="w-12 h-12 text-accent" />
              ) : (
                <DarkThemeIcon className="w-12 h-12 text-warning" />
              )}
            </button>
          </h1>
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
          <Popout important>
            <h5>Morio needs a configuration</h5>
            <span className="text-sm">
              Use the configuration wizard, or provide a configuration file to get started.
            </span>
          </Popout>
          <p className="text-center mt-4 opacity-50 text-sm">
            <a
              href="https://cert.europa.eu/"
              className="text-base-content hover:text-primary"
              title="To the CERT-EU website"
            >
              <b>MORIO</b>
              <span className="px-2">by</span>
              <b>CERT-EU</b>
            </a>
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

export const NotUnlessSetup = ({ children, pageProps }) => {
  const { api } = useApi()
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const loadConfig = async () => {
      const [content, status] = await api.getCurrentConfig()
      setConfig(content)
    }
    if (!config) loadConfig()
  }, [])

  if (config === null)
    return (
      <PageWrapper {...pageProps} layout={SplashLayout} header={false} footer={false}>
        <div className="flex flex-col items-center justify-between h-screen">
          <span> </span>
          <div className="flex flex-col gap-2 text-center">
            <h5 className="font-bold">MORIO</h5>
            <MorioIcon className="w-20 h-20 animate-spin mx-auto" />
            <span className="animate-pulse italic">loading configuration</span>
          </div>
          <span> </span>
        </div>
      </PageWrapper>
    )
  if (config === false) return <Setup pageProps={pageProps} />

  return children
}

const HomePage = (props) => {
  const { api } = useApi()

  return (
    <NotUnlessSetup pageProps={props}>
      <PageWrapper {...props}>
        <ContentWrapper {...props} Icon={MorioIcon} title={props.title}></ContentWrapper>
      </PageWrapper>
    </NotUnlessSetup>
  )
}

export default HomePage

export const getStaticProps = () => ({
  props: {
    title: 'Welcome to morio',
    page: [''],
  },
})
