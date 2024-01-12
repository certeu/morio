// Dependencies
import {
  views,
  keys,
  resolveNextView,
  resolveViewValue,
  viewInLocation,
  getView,
} from './views.mjs'
import { template, validate, validateConfiguration, iconSize } from 'lib/utils.mjs'
import get from 'lodash.get'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useView } from 'hooks/use-view.mjs'
import { useAtom } from 'jotai'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import Markdown from 'react-markdown'
import { Block } from './blocks/index.mjs'
import { PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Yaml } from 'components/yaml.mjs'
import { ConfigReport, DeploymentReport } from './report.mjs'
import { NavButton } from 'components/layout/sidebar.mjs'
import { LeftIcon, RightIcon, ConfigurationIcon, OkIcon } from 'components/icons.mjs'

const guessOwnIp = async () => {}

const includeNav = (entry, config) => {
  if (typeof entry.hide === 'undefined') return true
  if (entry.hide === null) return true
  if (typeof entry.hide === 'object') {
    /*
     * If next holds an object with an if property, resolve the condition
     */
    if (entry.hide.if && entry.hide.if.val) {
      const result = entry.hide.is === resolveViewValue(entry.hide.if, config)
      return entry.hide.is === resolveViewValue(entry.hide.if, config) ? false : true
    }
  }

  return false
}

/**
 * This React component renders the side menu with a list of various config views
 */
export const ConfigNavigation = ({
  view, // The current view
  nav = views, // Views for which to render a navigation structure
  loadView, // Method to load a view
  config, // The current configuration
}) => (
  <ul className="list list-inside list-disc ml-4">
    {Object.entries(nav)
      .filter(([key, entry]) => includeNav(entry, config))
      .map(([key, entry]) => (
        <li key={entry.id}>
          <button
            className={`btn ${
              entry.id === view ? 'btn-ghost' : 'btn-link no-underline hover:underline'
            } px-0 btn-sm`}
            onClick={() => loadView(entry.id)}
          >
            <span className={`${entry.children ? 'uppercase font-bold' : 'capitalize'}`}>
              {entry.title ? entry.title : entry.label}
            </span>
          </button>
          {entry.children && (
            <ConfigNavigation {...{ view, loadView, config }} nav={entry.children} />
          )}
        </li>
      ))}
  </ul>
)

/**
 * A helper method to turn a wizard url into a config path
 *
 * Eg: Turns core.node_count into `${prefix}/core/node_count`
 *
 * @param {string} url
 */
export const viewAsConfigPath = (view, prefix) =>
  view
    ? view
        .slice(prefix.length + 1)
        .split('/')
        .join('.')
    : prefix

/**
 * A helper method to turn a config key a wizard url
 *
 * Eg: Turns `${prefix}/core/node_count` into core.node_count
 */
const configPathAsView = (path, prefix) =>
  path ? prefix + '/' + path.split('.').join('/') : prefix

/**
 * This is the React component for the configuration wizard itself
 */
export const ConfigurationWizard = ({
  preloadConfig = {}, // Configuration to preload
  preloadView = false, // View to preload
  initialSetup = false, // Run in initial setup mode where only the core config is shown
  splash = false, // Whether to load the 'splash'  view where the rest of the UI is hidden
  prefix = '', // Prefix to use for the keeping the view state in the URL
  page = [], // page from the page props
  title = 'Configuration', // title from the page props
}) => {
  /*
   * React state
   */
  const [config, update] = useStateObject(preloadConfig) // Holds the config this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, _setView] = useAtom(viewInLocation) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the config preview
  const [dense, setDense] = useState(false)
  const [deployResult, setDeployResult] = useState(false)

  /*
   * Figure out the current configPath from the view
   */
  const configPath = viewAsConfigPath(view.pathname, prefix)

  /*
   * Handler method for view state updates
   */
  const setView = (configPath) => {
    _setView((prev) => ({
      ...prev,
      pathname: configPathAsView(configPath, prefix),
    }))
  }

  /*
   * Effect for preloading the view
   */
  useEffect(() => {
    if (preloadView && preloadView !== view) setView(preloadView)
  }, [preloadView])

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus, loading, LoadingProgress } = useContext(LoadingStatusContext)

  /*
   * Helper method to load a block into the wizard
   */
  const loadView = (key = false) => {
    /*
     * If nothing is passed (or the click event) we load the next view
     */
    if (!key || typeof key === 'object') key = resolveNextView(configPath, config)

    /*
     * Now set the view, update valid, and invalidate the report
     */
    setView(key)
    setValid(validate(key, get(config, key), config))
    setValidationReport(false)
  }

  /*
   * Helper method to update the configuration and set valid status
   */
  const updateConfig = (val, key = false) => {
    /*
     * Always update config
     */
    update(configPath, val)

    /*
     * But also run validate
     */
    const valid = validate(view, val, config)
    setValid(valid)
  }

  /*
   * Helper method to deploy the configuration
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading configuration'])
    const [data, status] = await api.deploy(config)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the configuration`, true, false])
    else {
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  /*
   * Helper method to figure out what view will be next
   */
  const whatsNext = () => resolveNextView(configPath, config)

  /*
   * Keep track of what will be the next view to load
   */
  const next = whatsNext()

  /*
   * Extract view from the views config
   */
  const viewConfig = getView(configPath)

  if (deployResult)
    return (
      <div className="w-fill min-h-screen max-w-2xl mx-auto">
        <DeploymentReport result={deployResult} />
      </div>
    )

  return (
    <div
      className={
        splash
          ? 'flex flex-wrap flex-row gap-8 justify-center min-h-screen'
          : 'flex flex-row-reverse gap-8 justify-between'
      }
    >
      <div
        className={
          splash
            ? 'w-52'
            : `w-64 border-l border-2 border-y-0 border-r-0 shrink-0 pt-12 min-h-screen border-secondary bg-base-300 bg-opacity-40 transition-all ${
                dense ? '-mr-64' : '-mr-0'
              }`
        }
      >
        {splash ? (
          <h3>Sections</h3>
        ) : (
          <>
            <button
              className={`w-full flex items-center justify-between py-2 uppercase text-primary ${
                dense
                  ? 'flex-row -ml-10 rounded-full bg-accent text-accent-content px-2'
                  : 'flex-row-reverse hover:bg-accent hover:text-accent-content px-4'
              }`}
              onClick={() => setDense(!dense)}
            >
              {dense ? (
                <LeftIcon className={iconSize} stroke={4} />
              ) : (
                <RightIcon className={iconSize} stroke={4} />
              )}
              <span>Views</span>
            </button>
          </>
        )}
        <ConfigNavigation
          view={configPath}
          loadView={loadView}
          nav={initialSetup ? [views.core] : Object.values(views)}
          config={config}
        />
      </div>
      <div className={splash ? 'w-full max-w-xl' : 'w-full p-8 pr-0 max-w-4xl'}>
        {splash ? null : <Breadcrumbs page={[...page, ...configPath.split('.')]} />}
        <div className="w-full">
          {splash ? null : (
            <h1 className="capitalize flex max-w-4xl justify-between">
              {title}
              <ConfigurationIcon className="w-16 h-16" />
            </h1>
          )}
          {view.pathname === `${prefix}/validate` ? (
            <>
              <h3>Validate Configuration</h3>
              {validationReport ? (
                <>
                  <ConfigReport report={validationReport} />
                  {validationReport.valid ? (
                    <button className="btn btn-warning btn-lg w-full mt-4" onClick={deploy}>
                      Deploy Configuration
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <p>You should now submit your configuration to the Morio API for validation.</p>
                  <p>
                    No changes will be made to your Morio setup at this time.
                    <br />
                    Instead, the configuration you created will be validated and tested to detect
                    any potential issues.
                  </p>
                  <button
                    className="btn btn-primary w-full mt-4"
                    onClick={async () =>
                      setValidationReport(
                        await validateConfiguration(api, config, setLoadingStatus)
                      )
                    }
                  >
                    Validate Configuration
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <Block update={updateConfig} {...{ config, viewConfig, setValid, configPath }} />
              {next && (
                <button
                  className="btn btn-primary w-full mt-4"
                  disabled={valid.error}
                  onClick={loadView}
                >
                  Continue
                </button>
              )}
              {valid?.error && (
                <ul className="list-inside text-sm text-error ml-2 mt-2">
                  {valid.error.details.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              )}
              {!preview && (
                <p className="text-center">
                  <button
                    onClick={() => setPreview(!preview)}
                    className="btn btn-ghost font-normal text-primary"
                  >
                    Show configuration preview
                  </button>
                </p>
              )}
            </>
          )}
          {preview && (
            <div className="w-full mt-8">
              <h3>Configuration Preview</h3>
              <Yaml js={config} />
              <p className="text-center">
                <button
                  onClick={() => setPreview(!preview)}
                  className="btn btn-ghost font-normal text-primary"
                >
                  Hide configuration preview
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
