import { useContext, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { MorioIcon, DarkThemeIcon, LightThemeIcon, WarningIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'
import { EphemeralInfo } from 'pages/index.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { Popout } from 'components/popout.mjs'
import { PageLink } from 'components/link.mjs'

/*
 * Avoid hydration woes with a dynamic import and disabled SSR rendering
 */
const DynamicSetupWizard = dynamic(
  () => import('components/settings/setup.mjs').then((mod) => mod.SetupWizard),
  { ssr: false }
)

export const EphemeralWrapper = ({ children }) => {
  const { theme, toggleTheme } = useTheme()
  const [ephemeral, setEphemeral] = useState(false)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Effect to check ephermeral state
   */
  useEffect(() => {
    const checkState = async () => {
      const result = await api.getStatus()
      if (result[1] === 200 && result[0].ephemeral === true) setEphemeral(true)
    }
    if (!ephemeral) checkState()
  }, [])

  return ephemeral === false ? (
    <div className="flex flex-col justify-center h-screen py-2 mx-auto max-w-xl">
      <div>
        <h1 className="flex flex-row gap-2 items-center justify-between">
          <MorioIcon className="w-12 h-12 text-primary" />
          <div className="text-4xl text-center">Setup completed</div>
          <button onClick={toggleTheme} title="Switch between dark and light mode">
            {theme === 'dark' ? (
              <LightThemeIcon className="w-12 h-12 text-accent hover:text-warning" />
            ) : (
              <DarkThemeIcon className="w-12 h-12 text-warning hover:text-accent" />
            )}
          </button>
        </h1>
        <Popout note>
          <h5>Morio&apos;s setup wizard can only be used in epehemeral state</h5>
          <p>
            This Morio instance has already been set up.
            <br />
            Use <PageLink href="/settings/start">the settings wizard</PageLink> to update your Morio
            deployment.
          </p>
        </Popout>
      </div>
    </div>
  ) : (
    children
  )
}

const ConfigWizardPage = (props) => {
  const { theme, toggleTheme } = useTheme()
  const { pushModal } = useContext(ModalContext)

  return (
    <PageWrapper {...props} layout={SplashLayout} header={false} footer={false}>
      <div className="px-4">
        <EphemeralWrapper>
          <div className="flex flex-col justify-between h-screen py-2 mx-auto max-w-xl">
            <span> </span>
            <div>
              <h1 className="flex flex-row gap-2 items-center justify-between">
                <MorioIcon className="w-12 h-12 text-primary" />
                <div className="text-4xl text-center">Welcome to Morio</div>
                <button onClick={toggleTheme} title="Switch between dark and light mode">
                  {theme === 'dark' ? (
                    <LightThemeIcon className="w-12 h-12 text-accent hover:text-warning" />
                  ) : (
                    <DarkThemeIcon className="w-12 h-12 text-warning hover:text-accent" />
                  )}
                </button>
              </h1>
            </div>
            <DynamicSetupWizard />
            <div>
              <p className="text-sm text-center">
                <button
                  onClick={() =>
                    pushModal(
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
              <p className="text-center opacity-50 text-sm">
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
        </EphemeralWrapper>
      </div>
    </PageWrapper>
  )
}

export default ConfigWizardPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Setup Wizard',
    page: ['setup'],
  },
})
