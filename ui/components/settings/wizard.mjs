// Dependencies
import get from 'lodash.get'
import { atomWithLocation } from 'jotai-location'
import { validate, validateSettings } from 'lib/utils.mjs'
// Templates
import { templates } from './templates/index.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect, useCallback } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useAtom } from 'jotai'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { Block } from './blocks/index.mjs'
import { Highlight } from 'components/highlight.mjs'
import { settingsReport, DeploymentReport } from './report.mjs'
import { RightIcon, SettingsIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { DiffViewer, diffCheck } from 'components/settings/diff.mjs'
import yaml from 'yaml'
import { SettingsNavigation } from './navigation.mjs'
import { viewAsSectionPath, sectionPathAsView } from './utils.mjs'

const Welcome = () => (
  <>
    <h3>Getting started</h3>
    <h5>About sections and groups</h5>
    <p>
      Settings are organized in <b>sections</b> and grouped in <b>groups</b>.
      <br />
      Groups merely add structure, and do not hold any settings, only sections do.
    </p>
    <h5>Undertanding state</h5>
    <p>
      Settings are kept in browser state, until you save them.
      <br />
      If you reload the page, your changes are lost.
    </p>
  </>
)

/**
 * Displays settings validation
 */
const ShowSettingsValidation = ({
  api,
  mSettings,
  deploy,
  validationReport,
  setValidationReport,
  validateSettings,
  setLoadingStatus,
}) => (
  <>
    {validationReport ? (
      <>
        <SettingsReport report={validationReport} />
        {validationReport.valid ? (
          <button className="btn btn-warning btn-lg w-full mt-4" onClick={deploy}>
            Deploy Settings
          </button>
        ) : null}
      </>
    ) : (
      <>
        <h3>Validate Settings</h3>
        <p>
          No changes will be made to your Morio setup at this time.
          <br />
          Instead, the settings you created will be validated and tested to detect any potential
          issues.
        </p>
        <p className="text-center">
          <button
            className="btn btn-primary w-full"
            onClick={async () =>
              setValidationReport(await validateSettings(api, mSettings, setLoadingStatus))
            }
          >
            Validate Settings
          </button>
        </p>
      </>
    )}
  </>
)

/**
 * Displays settings preview (or a button to show it)
 */
const ShowSettingsPreview = ({ preview, setPreview, mSettings }) =>
  preview ? (
    <div className="w-full mt-8">
      <h3>Settings Preview</h3>
      <Highlight language="yaml">{yaml.stringify(mSettings)}</Highlight>
      <p className="text-center">
        <button
          onClick={() => setPreview(!preview)}
          className="btn btn-ghost font-normal text-primary"
        >
          Hide settings preview
        </button>
      </p>
    </div>
  ) : (
    <p className="text-center">
      <button
        onClick={() => setPreview(!preview)}
        className="btn btn-ghost font-normal text-primary"
      >
        Show settings preview
      </button>
    </p>
  )

/**
 * Keeps track of the view in the URL location
 */
export const viewInLocation = atomWithLocation('deployment/node_count')

/*
 * Start wizard with this view
 */
const startView = 'start'

/**
 * This is the React component for the settings wizard itself
 */
export const SettingsWizard = (props) => {
  const [runningSettings, setRunningSettings] = useState(false) // Holds the current running settings
  const [revert, setRevert] = useState(0)
  const { api } = useApi()

  /*
   * Effect for loading the running settings
   */
  useEffect(() => {
    const getRunningSettings = async () => {
      const result = await api.getCurrentSettings()
      if (result[1] === 200 && result[0].deployment) {
        const newMSettings = { ...result[0] }
        setRunningSettings(JSON.parse(JSON.stringify(newMSettings)))
      } else console.log('nope', result)
    }
    getRunningSettings()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [revert])

  return runningSettings?.metadata ? (
    <PrimedSettingsWizard {...props} {...{ runningSettings, revert, setRevert }} />
  ) : (
    <p>One moment please...</p>
  )
}

/**
 * This is the React component for the settings wizard itself
 */
export const PrimedSettingsWizard = (props) => {
  /*
   * Destructure props
   */
  const { prefix = '/settings', runningSettings, revert, setRevert } = props

  /*
   * React state
   */
  const [mSettings, update, setMSettings] = useStateObject(runningSettings) // Holds the settings this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, _setView] = useAtom(viewInLocation) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the settings preview
  const [deployResult, setDeployResult] = useState(false)
  const [showDelta, setShowDelta] = useState(false)

  /*
   * Figure out the current sectionPath from the view
   */
  const sectionPath = viewAsSectionPath(view.pathname, prefix)

  /*
   * Handler method for view state updates
   */
  const setView = useCallback(
    (sectionPath) => {
      console.log('setting view to', sectionPath)
      _setView((prev) => ({
        ...prev,
        pathname: sectionPathAsView(sectionPath, prefix),
      }))
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [prefix]
  )

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Helper method to load a block into the wizard
   * Sets the view, update valid, and invalidate the report
   */
  const loadView = (key) => {
    setView(key)
    if (key !== 'validate') setValid(validate(key, get(mSettings, key), mSettings))
    setValidationReport(false)
  }

  /*
   * Helper method to deploy the settings
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading settings'])
    const [data, status] = await api.deploy(mSettings)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the settings`, true, false])
    else {
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  if (!mSettings.deployment) return null

  if (deployResult)
    return (
      <div className="w-fill min-h-screen max-w-2xl mx-auto">
        <DeploymentReport result={deployResult} />
      </div>
    )

  /*
   * Load the template and section
   */
  const [group, section] = sectionPath.split('.')
  const template = templates[group] ? templates[group](mSettings) : false

  /*
   * Handle settings delta
   */
  const delta =
    diffCheck(yaml.stringify(runningSettings), yaml.stringify(mSettings)).length > 1 ? true : false

  const showProps =
    section === 'validate'
      ? {
          api,
          mSettings,
          deploy,
          validationReport,
          setValidationReport,
          validateSettings,
          setLoadingStatus,
        }
      : {
          update,
          data: mSettings,
          setValid,
          sectionPath,
          template,
          group,
          section,
          valid,
          loadView,
          setView,
        }

  return (
    <div className="flex flex-row gap-8 justify-start">
      <div className="w-full max-w-4xl p-8 grow">
        <Breadcrumbs page={['settings', ...sectionPath.split('.')]} />
        <div className="w-full">
          <h1 className="capitalize flex w-full max-w-4xl justify-between">
            {template.children?.[section]?.title
              ? template.children[section]?.title
              : template.title
                ? template.title
                : 'Update Settings'}
            <SettingsIcon className="w-16 h-16" />
          </h1>
          {template === false ? <Welcome /> : <Block {...showProps} edit={true} />}
          {delta ? (
            <Popout note>
              <h4>You have made changes that are yet to be deployed</h4>
              <p>
                The settings habe been edited, and is now different from those currently deployed.
              </p>
              {showDelta ? (
                <div className="my-4">
                  <DiffViewer
                    from={yaml.stringify(runningSettings)}
                    to={yaml.stringify(mSettings)}
                    fromTitle="Currently deployed settings"
                    toTitle="Your edits"
                  />
                </div>
              ) : null}
              <div className="flex flex-row flex-wrap gap-2 justify-end w-full">
                <button className="btn btn-warning btn-ghost" onClick={() => setRevert(revert + 1)}>
                  Revert to Running Settings
                </button>
                <button
                  className="btn btn-primary btn-outline"
                  onClick={() => setShowDelta(!showDelta)}
                >
                  {showDelta ? 'Hide' : 'Show'} Settings Delta
                </button>
                <button className="btn btn-primary" onClick={() => setView('validate')}>
                  Validate Changed to Settings
                </button>
              </div>
            </Popout>
          ) : null}
          <ShowSettingsPreview {...{ preview, setPreview, mSettings }} />
        </div>
      </div>
      <div className="grow-0 shrink-0 pt-24 min-h-screen">
        <h5>Settings</h5>
        <SettingsNavigation
          view={sectionPath}
          loadView={loadView}
          nav={templates}
          mSettings={mSettings}
          edit
        />
      </div>
    </div>
  )
}
