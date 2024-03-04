// Dependencies
import { validateSettings } from 'lib/utils.mjs'
// Deployment template
import { deployment } from './templates/deployment.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { SettingsReport } from './report.mjs'
import { FormBlock } from './blocks/form.mjs'
import { Spinner, LogoSpinner } from 'components/animations.mjs'
import { StatusLogs } from 'components/status-logs.mjs'
import { Box } from 'components/box.mjs'
import { Markdown } from 'components/markdown.mjs'
import { OkIcon } from 'components/icons.mjs'

/*
 * Displays configuration validation
 */
const ShowConfigurationValidation = ({ deploy, validationReport, toggleValidate }) => (
  <>
    {validationReport ? (
      <>
        <h3>Validation Results</h3>
        <SettingsReport report={validationReport} />
        {validationReport.valid ? (
          <button className="btn btn-accent btn-lg w-full mt-4" onClick={deploy}>
            Deploy Configuration
          </button>
        ) : null}
      </>
    ) : (
      <div className="text-center text-2xl">
        <div className="w-32 mx-auto mb-4 text-primary">
          <LogoSpinner />
        </div>
        One moment please
      </div>
    )}
    <p className="text-center">
      <button className="btn btn-primary btn-ghost mt-4" onClick={toggleValidate}>
        Back to Settings
      </button>
    </p>
  </>
)

/**
 * This is the React component for the setup wizard itself
 */
export const SetupWizard = ({ preload = {}, validate = false }) => {
  /*
   * React state
   */
  const [mSettings, update] = useStateObject(preload) // Holds the settings object this wizard builds
  const [validationReport, setValidationReport] = useState(false) // Holds the validation report
  const [deployResult, setDeployResult] = useState(false)
  const [deploymentOngoing, setDeploymentOngoing] = useState(false)
  const [validateView, setValidateView] = useState(validate)
  const [lastLogLine, setLastLogLine] = useState(false)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Helper method to deploy the configuration
   */
  const deploy = async () => {
    setDeploymentOngoing(true)
    setLoadingStatus([true, 'Deploying your configuration, this will take a while'])
    const [data, status] = await api.setup(mSettings)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the configuration`, true, false])
    else {
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  if (deploymentOngoing) {
    const done = lastLogLine?.msg === 'Morio Core ready - Configuration Resolved'
    const text = `text-${done ? 'success' : 'accent'}-content`
    return (
      <div className="flex flex-wrap flex-row gap-8 justify-center min-h-screen">
        <div className="w-full max-w-xl">
          <Box color={done ? 'success' : 'accent'}>
            <div className={`flex flex-row items-center gap-2 ${text}`}>
              <div className="w-6 h-6">
                {done ? (
                  <OkIcon className="w-6 h-6 text-success-content" stroke={4} />
                ) : (
                  <LogoSpinner />
                )}
              </div>
              {done ? (
                <Markdown className={`mdx dense ${text} inherit-color grow`}>
                  {lastLogLine?.msg}
                </Markdown>
              ) : (
                <span>Please wait while your settings are being deployed.</span>
              )}
            </div>
          </Box>
          <h3>Status Logs</h3>
          <StatusLogs lastLineSetter={setLastLogLine} />
        </div>
      </div>
    )
  }

  const toggleValidate = async () => {
    if (!validateView) {
      setValidationReport(await validateSettings(api, mSettings, setLoadingStatus))
    }
    setValidateView(!validateView)
  }
  const formEl = deployment(mSettings, toggleValidate).children.setup.form

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="w-full">
        {validateView ? (
          <ShowConfigurationValidation
            {...{
              api,
              mSettings,
              deploy,
              validationReport,
              setValidationReport,
              validateSettings,
              setLoadingStatus,
              toggleValidate,
            }}
          />
        ) : (
          <>
            <FormBlock update={update} data={mSettings} form={formEl} />
          </>
        )}
      </div>
    </div>
  )
}
