// Dependencies
import get from 'lodash.get'
import set from 'lodash.set'
import { atomWithLocation } from 'jotai-location'
import { validateSettings } from 'lib/utils.mjs'
// Deployment template
import { deployment } from './templates/deployment.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect, useCallback } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useAtom } from 'jotai'
// Components
import { Block } from './blocks/index.mjs'
import { Yaml } from 'components/yaml.mjs'
import { SettingsReport, DeploymentReport } from './report.mjs'
import { RightIcon } from 'components/icons.mjs'
import { Spinner } from 'components/animations.mjs'
import { ValidationErrors } from 'components/inputs.mjs'
import { FormBlock } from './blocks/form.mjs'
import { Progress, LogoSpinner } from 'components/animations.mjs'

/*
 * Displays configuration validation
 */
const ShowConfigurationValidation = ({
  api,
  mSettings,
  deploy,
  validationReport,
  setValidationReport,
  validateSettings,
  setLoadingStatus,
  toggleValidate,
}) => (
  <>
    {validationReport ? (
      <>
        <h3>Validation Results</h3>
        <SettingsReport report={validationReport} />
        {validationReport.valid ? (
          <button className="btn btn-warning btn-lg w-full mt-4" onClick={deploy}>
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
  const [mSettings, update, setMSettings] = useStateObject(preload) // Holds the settings object this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current settings are valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validation report
  const [deployResult, setDeployResult] = useState(false)
  const [deploymentOngoing, setDeploymentOngoing] = useState(false)
  const [validateView, setValidateView] = useState(validate)

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
    const [data, status] = await api.deploy(mSettings)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the configuration`, true, false])
    else {
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  if (deploymentOngoing)
    return (
      <div className="flex flex-wrap flex-row gap-8 justify-center min-h-screen">
        <div className="w-full max-w-xl">
          {deployResult ? (
            <>
              <h3>Deployment initiated</h3>
              <DeploymentReport result={deployResult} />
            </>
          ) : (
            <>
              <h3>Deploy requested</h3>
              <p>Please wait while your settings are being deployed.</p>
              <Spinner />
            </>
          )}
        </div>
      </div>
    )

  const toggleValidate = async () => {
    if (!validateView) {
      setValidationReport(await validateSettings(api, mSettings, setLoadingStatus))
    }
    setValidateView(!validateView)
  }

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
            <FormBlock
              {...{ update }}
              data={mSettings}
              form={deployment(mSettings, toggleValidate).children.setup.form}
            />
          </>
        )}
      </div>
    </div>
  )
}
