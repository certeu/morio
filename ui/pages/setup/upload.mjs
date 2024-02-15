// Dependencies
import yaml from 'js-yaml'
// Hooks
import { useState, useContext } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { FileInput } from 'components/inputs.mjs'
import { SetupWizard } from 'components/settings/setup.mjs'
import { Link } from 'components/link.mjs'
import { MorioIcon, DarkThemeIcon, LightThemeIcon, WarningIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'
import { EphemeralInfo } from 'pages/index.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'

const SettingsUploadPage = (props) => {
  /*
   * React state
   */
  const [mSettings, setMSettings] = useState() // Holds the uploaded data parsed into a settings object
  const [error, setError] = useState(false)

  const { setModal } = useContext(ModalContext)

  const { theme, toggleTheme } = useTheme()
  /*
   * Upload handler
   */
  const processUpload = (upload) => {
    let data
    try {
      const chunks = upload.split(',')
      if (chunks[0].includes('json')) data = JSON.parse(atob(chunks[1]))
      else data = yaml.parse(atob(chunks[1]))
    } catch (err) {
      setError(err)
    }
    setMSettings(data)
  }

  return (
    <PageWrapper {...props} layout={SplashLayout} header={false} footer={false}>
      {error ? <pre>{JSON.stringify(error, null, 2)}</pre> : null}
      {mSettings ? (
        <div className="py-12 px-4">
          <h1 className="text-center">Set Up Morio</h1>
          <SetupWizard preloadSettings={mSettings} preloadView="validate" />
        </div>
      ) : (
        <div className="px-4">
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
                  <Link href="/setup/wizard" className="btn btn-ghost">
                    Use the Setup Wizard
                  </Link>
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-center">
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
        </div>
      )}
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
