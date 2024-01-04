// Dependencies
import { isUri, download } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { StringInput } from 'components/inputs.mjs'
import { ConfigurationWizard } from 'components/config/wizard.mjs'

const ConfigUploadPage = (props) => {
  /*
   * React state
   */
  const [uri, setUri] = useState() // Holds the uri input
  const [config, setConfig] = useState() // Holds the uploaded data parsed into a config
  const [validationReport, setValidationReport] = useState(false) // Holds the validation report
  const [error, setError] = useState(false)

  /*
   * Download handler
   */
  const processDownload = async (upload) => {
    let result, data
    try {
      ;[result, data] = await download(uri)
      // Could be JSON
      data = JSON.parse(data)
    } catch (err) {
      try {
        // Could be YAML
        data = yaml.read(data)
      } catch (err) {
        setError(err)
      }
    }
    setConfig(data)
  }

  return (
    <PageWrapper {...props} layout={SplashLayout}>
      {config ? (
        <div className="py-12 px-4">
          <h1 className="text-center">Configure Morio</h1>
          <ConfigurationWizard preloadConfig={config} preloadView="validate" />
        </div>
      ) : (
        <div className="py-12 px-4 max-w-xl m-auto">
          <h1 className="text-center">{props.title}</h1>
          <StringInput
            label="URL of the configuration file (YAML or JSON)"
            id="config"
            type="uri"
            className="input input-secondary w-full input-bordered"
            placeholder="Paste your URI here"
            value={uri}
            update={(val) => setUri(val)}
          />
          <button
            className="btn btn-primary w-full mt-4"
            disabled={!isUri(uri)}
            onClick={processDownload}
          >
            Download confguration
          </button>
        </div>
      )}
    </PageWrapper>
  )
}

export default ConfigUploadPage

export const getStaticProps = () => ({
  props: {
    title: 'Download a Morio configuration file',
    page: ['setup', 'upload'],
  },
})
