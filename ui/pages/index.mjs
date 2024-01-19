import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Link, linkClasses, PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { MorioIcon, DarkThemeIcon, LightThemeIcon, WarningIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'

const EphemeralInfo = () => (
  <div className="min-h-92 max-w-prose">
    <h2>
      Morio&apos;s Ephemeral
      <sup>
        <a href="https://www.merriam-webster.com/dictionary/ephemeral" target="_BLANK">
          *
        </a>
      </sup>{' '}
      State
    </h2>
    <p>
      Before a Morio node receives its initial configuration, it will run in an ephemeral state,
      where it does nothing but eagerly await its initial setup.
    </p>
    <p>
      To bring this node out of its ephemeral state, you need to configure it.
      <br />
      We recommend to <PageLink href="/setup/wizard">use the setup wizard</PageLink> to do so.
    </p>
    <Popout important>
      <h5>
        Beware of spawn camping
        <sup>
          <a
            href="https://en.wikipedia.org/wiki/Camping_(video_games)#Spawn_camping"
            target="_BLANK"
          >
            *
          </a>
        </sup>
      </h5>
      <p>
        Ephemeral nodes <b>can be set up by anyone who connects to them</b>.
        <br />
        Firewall ephemeral Morio node(s) to prevent this.
      </p>
    </Popout>
  </div>
)

const Setup = ({ pageProps }) => {
  const { theme, toggleTheme } = useTheme()
  const { setModal } = useContext(ModalContext)

  return (
    <PageWrapper {...pageProps} layout={SplashLayout} header={false} footer={false}>
      <div className="px-4">
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
              Use the Setup Wizard
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
          <p className="text-sm text-center mt-8">
            <button
              onClick={() =>
                setModal(
                  <ModalWrapper>
                    <EphemeralInfo />
                  </ModalWrapper>
                )
              }
              className="btn btn-warning btn-outline"
            >
              <div className="flex flex-row gap-4 items-center">
                <WarningIcon />
                <span>Running in Ephemeral State</span>
                <WarningIcon />
              </div>
            </button>
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
      const [content] = await api.getCurrentConfig()
      setConfig(content)
    }
    if (!config) loadConfig()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
  if (typeof config.deployment === 'undefined') return <Setup pageProps={pageProps} />

  return children
}

const HomePage = (props) => (
  <NotUnlessSetup pageProps={props}>
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={MorioIcon} title={props.title}>
        <Popout fixme compact>
          This is a work in progress
        </Popout>
      </ContentWrapper>
    </PageWrapper>
  </NotUnlessSetup>
)

export default HomePage

export const getStaticProps = () => ({
  props: {
    title: 'Welcome to morio',
    page: [''],
  },
})
