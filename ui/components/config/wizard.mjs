// Dependencies
import { views, keys, resolveNextView, resolveViewValue, viewInHash, getView } from './views.mjs'
import { template, validate, validateConfiguration } from 'lib/utils.mjs'
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
import Markdown from 'react-markdown'
import { Block } from './blocks/index.mjs'
import { PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Yaml } from 'components/yaml.mjs'
import { ConfigReport } from './report.mjs'
import { NavButton, iconSize } from 'components/layout/sidebar.mjs'
import { LeftIcon, RightIcon } from 'components/icons.mjs'

/**
 * This React component renders the side menu with a list of various config views
 */
export const ConfigNavigation = ({
  view, // The current view
  nav = views, // Views for which to render a navigation structure
  loadView, // Method to load a view
}) => (
  <ul className="list list-inside list-disc ml-4">
    {Object.entries(nav)
      .filter(([key, entry]) => entry !== null && typeof entry?.hide === 'undefined')
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
          {entry.children && <ConfigNavigation {...{ view, loadView }} nav={entry.children} />}
        </li>
      ))}
  </ul>
)

/**
 * This is the React component for the configuration wizard itself
 */
export const ConfigurationWizard = ({
  preloadConfig = {}, // Configuration to preload
  preloadView = false, // View to preload
  initialSetup = false, // Run in initial setup mode where only the core config is shown
  splash = false, // Whether to load the 'splash'  view where the rest of the UI is hidden
}) => {
  /*
   * React state
   */
  const [config, update] = useStateObject(preloadConfig) // Holds the config this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, setView] = useAtom(viewInHash) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the config preview
  const [dense, setDense] = useState(false)

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
    if (!key || typeof key === 'object') key = resolveNextView(view, config)

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
    update(view, val)

    /*
     * But also run validate
     */
    const valid = validate(view, val, config)
    setValid(valid)
  }

  /*
   * Helper method to figure out what view will be next
   */
  const whatsNext = () => resolveNextView(view, config)

  /*
   * Keep track of what will be the next view to load
   */
  const next = whatsNext()

  /*
   * Extract view from the views config
   */
  const viewConfig = getView(view)

  return (
    <div
      className={
        splash
          ? 'flex flex-wrap flex-row gap-8 justify-center'
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
          view={view}
          loadView={loadView}
          nav={initialSetup ? [views.morio] : Object.values(views)}
        />
      </div>
      <div className={splash ? 'w-full max-w-xl' : 'w-full mx-auto max-w-2xl p-8'}>
        {view === 'validate' ? (
          <>
            <h3>Validate Configuration</h3>
            {validationReport ? (
              <ConfigReport report={validationReport} />
            ) : (
              <>
                <p>You should now submit your configuration to the Morio API for validation.</p>
                <p>
                  No changes will be made to your Morio setup at this time.
                  <br />
                  Instead, the configuration you created will be validated and tested to detect any
                  potential issues.
                </p>
              </>
            )}
            <button
              className="btn btn-primary w-full mt-4"
              onClick={async () =>
                setValidationReport(await validateConfiguration(api, config, setLoadingStatus))
              }
            >
              Validate Configuration
            </button>
          </>
        ) : (
          <>
            <Block update={updateConfig} {...{ config, viewConfig, setValid }} />
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
      </div>
      {preview && (
        <div className={splash ? 'w-full max-w-lg' : 'w-full max-w-xl p-8'}>
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
  )
}
