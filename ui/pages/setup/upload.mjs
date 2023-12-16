// Hooks
import { useState } from 'react'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { FileInput } from 'components/inputs.mjs'
import { ConfigurationWizard } from 'components/config/wizard.mjs'

const ConfigUploadPage = (props) => {
  /*
   * React state
   */
  const [uploaded, setUploaded] = useState() // Holds the uploaded data
  const [config, setConfig] = useState() // Holds the uploaded data parsed into a config
  const [validationReport, setValidationReport] = useState(false) // Holds the validation report
  const [error, setError] = useState(false)

  /*
   * Upload handler
   */
  const processUpload = (upload) => {
    let type, b64, data
    try {
      ;[type, b64] = upload.split(',')
      if (type.includes('json')) data = JSON.parse(atob(b64))
      else data = yaml.parse(atob(b64))
    } catch (err) {
      setError(err)
    }
    setConfig(data)
  }

  return (
    <PageWrapper {...props} layout={SplashLayout}>
      {error ? <pre>{JSON.stringify(error, null, 2)}</pre> : null}
      {config ? (
        <div className="py-12 px-4">
          <h1 className="text-center">Configure Morio</h1>
          <ConfigurationWizard preloadConfig={config} preloadView="validate" />
        </div>
      ) : (
        <div className="py-12 px-4 max-w-xl m-auto">
          <h1 className="text-center">{props.title}</h1>
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
        </div>
      )}
    </PageWrapper>
  )
}

export default ConfigUploadPage

export const getStaticProps = () => ({
  props: {
    title: 'Upload a Morio configuration file',
    page: ['setup', 'upload'],
  },
})
