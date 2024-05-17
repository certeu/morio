// Dependencies
import yaml from 'yaml'
import { validateSettings } from 'lib/utils.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Box } from 'components/box.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { FileInput } from 'components/inputs.mjs'
import { Link } from 'components/link.mjs'
import { OkIcon, MorioIcon, DarkThemeIcon, LightThemeIcon, WarningIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'
import { EphemeralInfo } from 'pages/index.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { LogoSpinner } from 'components/animations.mjs'
import { SettingsReport } from 'components/settings/report.mjs'
import { EphemeralWrapper } from './index.mjs'

const SettingsUploadPage = (props) => {
  /*
   * React state
   */
  const [mSettings, setMSettings] = useState() // Holds the uploaded data parsed into a settings object
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(false)
  const [deployResult, setDeployResult] = useState(false)

  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { api } = useApi()
  const { theme, toggleTheme } = useTheme()

  /*
   * Upload handler
   */
  const processUpload = async (upload) => {
    setLoadingStatus([true, 'Processing upload'])
    setLoading(true)
    let data
    try {
      const chunks = upload.split(',')
      if (chunks[0].includes('json')) data = JSON.parse(atob(chunks[1]))
      else data = yaml.parse(atob(chunks[1]))
      setMSettings(data)
      const report = await validateSettings(api, data, setLoadingStatus)
      setReport(report)
      setLoading(false)
    } catch (err) {
      setError(err)
      console.log(err)
    }
  }

  /*
   * Resets all state
   */
  const restart = () => {
    setError(false)
    setLoading(false)
    setReport(false)
  }

  /*
   * Helper method to deploy the configuration
   */
  const deploy = async () => {
    setLoading(true)
    setLoadingStatus([true, 'Deploying your settings, this will take a while'])
    const [data, status] = await api.setup(mSettings)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the configuration`, true, false])
    else {
      setLoading(false)
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  if (deployResult) {
    const text = `text-${deployResult?.root_token ? 'success' : 'accent'}-content`
    return (
      <PageWrapper {...props} layout={SplashLayout} header={false} footer={false} role={false}>
        <div className="flex flex-wrap flex-row gap-8 justify-center">
          <div className="w-full max-w-xl">
            <Box color={deployResult?.root_token ? 'success' : 'accent'}>
              <div className={`flex flex-row items-center gap-2 ${text}`}>
                <div className="w-6 h-6">
                  {deployResult?.root_token ? (
                    <OkIcon className="w-6 h-6 text-success-content" stroke={4} />
                  ) : (
                    <LogoSpinner />
                  )}
                </div>
                {deployResult.root_token ? (
                  <span>Settings deployed.</span>
                ) : (
                  <span>Please wait while your settings are being deployed.</span>
                )}
              </div>
            </Box>
            {deployResult?.root_token ? (
              <>
                <Popout important>
                  <h5>Store the Morio Root Token in a safe place</h5>
                  <p>
                    Below is the Morio Root Token which you can use to authenticate while no (other)
                    authentication provider has been setup.
                  </p>
                  <Highlight>{deployResult.root_token}</Highlight>
                </Popout>
                <p className="text-center">
                  <Link className="btn btn-primary nt-4 btn-lg" href="/">
                    Go to the Home Page
                  </Link>
                </p>
              </>
            ) : null}
          </div>
          <span></span>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper {...props} layout={SplashLayout} header={false} footer={false} role={false}>
      {error ? <pre>{JSON.stringify(error, null, 2)}</pre> : null}
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
              <div className="py-12 px-4 max-w-xl m-auto">
                {loading ? (
                  <div className="w-52 mx-auto text-center text-lg font-bold">
                    <LogoSpinner />
                    <br />
                    One moment please
                  </div>
                ) : null}
                {!loading && report ? (
                  <>
                    <SettingsReport report={report} />
                    <p className="text-center mt-4">
                      {report.deployable ? (
                        <button className="btn btn-primary btn-lg w-full" onClick={deploy}>
                          Apply Settings
                        </button>
                      ) : (
                        <button className="btn btn-primary w-52 mx-auto" onClick={restart}>
                          Back
                        </button>
                      )}
                    </p>
                  </>
                ) : null}
                {!loading && !report ? (
                  <>
                    <h3 className="text-center">{props.title}</h3>
                    <FileInput
                      label="Settings file (YAML or JSON)"
                      update={processUpload}
                      current=""
                      id="file"
                      dropzoneConfig={{
                        accept: {
                          'application/json': ['.json'],
                          'application/yaml': ['.yaml', '.yml'],
                        },
                        maxFiles: 1,
                        multiple: false,
                      }}
                    />
                    <p className="text-center">
                      <Link href="/setup" className="btn btn-ghost">
                        Use the Setup Wizard
                      </Link>
                    </p>
                  </>
                ) : null}
              </div>
            </div>
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

export default SettingsUploadPage

export const getStaticProps = () => ({
  props: {
    title: 'Provide a Morio Settings File',
    page: ['setup', 'upload'],
  },
})
