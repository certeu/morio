// Dependencies
import yaml from 'js-yaml'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { FileInput } from 'components/inputs.mjs'
import { SetupWizard } from 'components/mconfig/setup-wizard.mjs'
import { Link } from 'components/link.mjs'
import { MorioIcon, DarkThemeIcon, LightThemeIcon, WarningIcon } from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'

const ConfigUploadPage = (props) => {
  /*
   * React state
   */
  const [config, setConfig] = useState() // Holds the uploaded data parsed into a config
  const [error, setError] = useState(false)

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
    setConfig(data)
  }

  return (
    <PageWrapper {...props} layout={SplashLayout} header={false} footer={false}>
      {error ? <pre>{JSON.stringify(error, null, 2)}</pre> : null}
      {config ? (
        <div className="py-12 px-4">
          <h1 className="text-center">Configure Morio</h1>
          <SetupWizard preloadConfig={config} preloadView="validate" />
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
                  label="Configuration file (YAML or JSON)"
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

export default ConfigUploadPage

export const getStaticProps = () => ({
  props: {
    title: 'Provide a Morio Configuration File',
    page: ['setup', 'upload'],
  },
})
