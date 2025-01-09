// Dependencies
import { cloneAsPojo } from 'lib/utils.mjs'
import yaml from 'yaml'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { NoteIcon, ExpandIcon, OkIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { DiffViewer, diffCheck } from 'components/settings/diff.mjs'
import { Box } from 'components/box.mjs'
import {
  getRunningSettings,
  getDynamicConfig,
  ShowSettingsValidation,
} from './wizard.mjs'
import CodeMirror from '@uiw/react-codemirror'
import { json as jsonLang } from '@codemirror/lang-json'
import { Tab, Tabs } from 'components/tabs.mjs'

/**
 * This is the React component for the settings editor
 */
export const SettingsEditor = (props) => {
  const [runningSettings, setRunningSettings] = useState(false) // Holds the current running settings
  const [dconf, setDconf] = useState(false) // Holds the dynamic configuration
  const [notCool, setNotCool] = useState(false)
  const { api } = useApi()

  /*
   * Effect for loading the running settings
   * This also loads the dynamic tap settings
   */
  useEffect(() => {
    getRunningSettings(api, setRunningSettings, setNotCool)
    getDynamicConfig(api, setDconf)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  if (notCool) return <p>Things are not cool...</p>
  if (runningSettings?.cluster) return <PrimedSettingsEditor {...props} {...{ runningSettings, dconf }} />
  return <p>One moment please...</p>
}

/**
 * This is the React component for the settings editor itself
 */
export const PrimedSettingsEditor = (props) => {
  /*
   * Destructure props
   */
  const { runningSettings } = props

  /*
   * React state
   */
  /* eslint-disable-next-line no-unused-vars */
  const [mSettings, update, setMSettings] = useStateObject(runningSettings) // Holds the settings
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [showDelta, setShowDelta] = useState(false)
  const [deployOngoing, setDeployOngoing] = useState(false)
  const [doValidate, setDoValidate] = useState(false)
  const [kiosk, setKiosk] = useState(false)
  const [localJson, setLocalJson] = useState(JSON.stringify(runningSettings, null ,2)) // Holds the settings as JSON
  const [localYaml, setLocalYaml] = useState(yaml.stringify(runningSettings)) // Holds the settings as YAML

  /*
   * Method to revert to running settings
   */
  const revert = () => setMSettings(cloneAsPojo(runningSettings))

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Helper method to deploy the settings
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading settings'])
    setDeployOngoing(true)
    const result = await api.deploy(mSettings)
    return result[1] === 204
      ? setLoadingStatus([true, 'Settings updated', true, true])
      : setLoadingStatus([true, `Unable to deploy the settings`, true, false])
  }

  if (!mSettings.cluster) return null

  /*
   * Handle settings delta
   */
  const delta =
    diffCheck(yaml.stringify(runningSettings), yaml.stringify(mSettings)).length > 1 ? true : false

  if (deployOngoing)
    return (
      <>
        <Box color="success">
          <div className="flex flex-row items-center gap-2 text-success-content">
            <div className="w-6 h-6">
              <OkIcon className="w-6 h-6 text-success-content" stroke={4} />
            </div>
            Settings are being deployed
          </div>
        </Box>
        <p>Please wait as Morio applies the new settings.</p>
      </>
    )

  const onChangeYaml = (input) => {
    let newSettings
    try {
      newSettings = yaml.parse(input)
      if (newSettings) {
        setLocalYaml(input)
        setMSettings(newSettings)
      }
    }
    catch (err) {
      // This is fine
    }
  }
  const onChangeJson = (input) => {
    let newSettings
    try {
      newSettings = JSON.parse(input)
      if (newSettings) {
        setLocalJson(input)
        setMSettings(newSettings)
      }
    }
    catch (err) {
      console.log(err)
      // This is fine
    }
  }


  return (
    <>
      {mSettings.preseed?.base ? (
        <Popout warning>
          <h5>These settings are preseeded</h5>
          <p>
            This Morio deployment uses preseeded settings. This means the settings are loaded from a
            remote system, typically a version control system like GitLab or GitHub.
          </p>
          <p>
            While you <b>can</b> update the settings here, those settings will be lost next time
            Morio is reseeded.
            <br />
            You probably should <b>update the preseeded setting instead</b>.
          </p>
        </Popout>
      ) : null}
      {doValidate
        ? <>
            <ShowSettingsValidation  {...{
              api,
              deploy,
              mSettings,
              setLoadingStatus,
              setValidationReport,
              validationReport,
            }}/>
            <p className="text-right w-full">
              <button
                className="btn btn-primary btn-outline btn-s btn-sm"
                onClick={() => setDoValidate(false)}
              >
              <NoteIcon />  Back to editor
              </button>
            </p>
          </>
        : (
          <div className={kiosk
            ? "absolute top-12 left-0 w-screen h-screen z-50 bg-base-100"
            : ""
          }>
            <Tabs tabs="YAML, JSON">
              <Tab id="json" name="test" label="As YAML">
                <CodeMirror
                  value={localYaml}
                  height={kiosk ? "90vh" : "70vh"}
                  onChange={onChangeYaml}
                />
              </Tab>
              <Tab id="yaml" label="As JSON">
                <CodeMirror
                  value={localJson}
                  height={kiosk ? "90vh" : "70vh"}
                  extensions={[jsonLang()]}
                  onChange={onChangeJson}
                />
              </Tab>
            </Tabs>
            <div className="my-2 w-full flex flex-row flex-wrap items-center gap-2 justify-center">
              <button
                className="btn btn-primary btn-outline flex flex-row items-center gap-2"
                onClick={() => setKiosk(!kiosk)}
              >
                <ExpandIcon /> {kiosk ? 'Collapse' : 'Expand'}
              </button>
              <button className="btn btn-primary" onClick={() => setDoValidate(true)}>
                Validate Settings
              </button>
            </div>
          </div>
        )
      }
      {!doValidate && delta ? (
        <Popout note>
          <h4>You have made changes that are yet to be deployed</h4>
          <p>The settings have been edited, and are now different from the deployed settings.</p>
          {showDelta ? (
            <div className="my-4 w-full overflow-scroll">
              <DiffViewer
                from={yaml.stringify(runningSettings)}
                to={yaml.stringify(mSettings)}
                fromTitle="Currently deployed settings"
                toTitle="Your edits"
              />
            </div>
          ) : null}
          <div className="flex flex-row flex-wrap gap-2 justify-end w-full">
            <button className="btn btn-warning btn-ghost" onClick={revert}>
              Revert to Running Settings
            </button>
            <button
              className="btn btn-primary btn-outline"
              onClick={() => setShowDelta(!showDelta)}
            >
              {showDelta ? 'Hide' : 'Show'} Settings Delta
            </button>
          </div>
        </Popout>
      ) : null}
    </>
  )
}
