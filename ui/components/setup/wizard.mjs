// Dependencies
import wizard from 'config/ui/config-wizard.yaml'
import { template, validate } from 'lib/utils.mjs'
import get from 'lodash.get'
import { atomWithHash } from 'jotai-location'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useView } from 'hooks/use-view.mjs'
import { useAtom } from 'jotai'
// Components
import Markdown from 'react-markdown'
import { Block } from './blocks.mjs'
import { PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Yaml } from 'components/yaml.mjs'
import { OkIcon, WarningIcon } from 'components/icons.mjs'

/*
 * When no view is present, this is the default
 */
const START_VIEW = 'morio.node_count'

/**
 * A React component to display a configuration report
 *
 * @param {object} report - The report object returns from the API
 * @return {functino} component - The React component
 */
const ConfigReport = ({ report }) => (
  <div className="py-2">
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <div className="text-inherit">
          This configuration
          {report.valid ? <span> is </span> : <b className="px-1 underline">is NOT</b>}
          valid
        </div>
      </div>
    </Box>
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <div className="text-inherit">
          This configuration
          {report.valid ? <span> can </span> : <b className="px-1 underline">CANNOT</b>}
          be deployed
        </div>
      </div>
    </Box>
    {['errors', 'warnings', 'info'].map((type) =>
      report[type].length > 0 ? (
        <div key={type} className="mt-3">
          <h6 className="capitalize">{type}</h6>
          <Messages list={report[type]} />
        </div>
      ) : null
    )}
  </div>
)

/**
 * A React compnent to display messages from a configuration report
 */
const Messages = ({ list }) => (
  <ul className="list list-disc list-inside pl-2">
    {list.map((msg, i) => (
      <li key={i}>{msg}</li>
    ))}
  </ul>
)

/**
 * Little helper component to display a box in the report
 */
const Box = ({ color, children }) => (
  <div
    className={`bg-${color} text-${color}-content rounded-lg p-4 w-full bg-opacity-80 shadow mb-2`}
  >
    {children}
  </div>
)

/**
 * A helper function to resolve the next view from the wizard config
 *
 * @param {string|number|object} next - The next key in the wizard config
 * @param {object} config - The configuration from React state
 * @return {string} next - The resolve next value
 */
const resolveNextView = (view, config) => {
  /*
   * First we need to figure out what's next
   */
  const next = wizard[view].next

  /*
   * If it's a string, we don't need to do anything else
   */
  if (typeof next === 'string') return next

  /*
   * If it's an object with an if property,
   * we need a bit more work to know what view is next
   */
  if (next.if) {
    /*
     * First resolve the value to check
     */
    const check = resolveValue(next.if, config, template)
    /*
     * Now check it against the condition
     */
    if (check === next.is) return template(next.then, { CONFIG: config })
    else return template(next.else, { CONFIG: config })
  }

  return false
}

/**
 * A helper method to resolve a value from the wizard config through templating
 */
const resolveValue = (input, config, template) => {
  let val = input
  if (typeof input === 'object') {
    val = template(input.val, { CONFIG: config })
    if (['number', 'string'].includes(input.as)) {
      if (input.as === 'number') val = Number(val)
      if (input.as === 'string') val = String(val)
    }
  } else val = template(input, { CONFIG: config })

  return val
}

/**
 * Keeps track of the view in the URL hash
 */
const viewInHash = atomWithHash('view', START_VIEW)

/**
 * This is the React component for the configuration wizard itself
 */
export const ConfigurationWizard = () => {
  /*
   * React state
   */
  const [config, update] = useStateObject() // Holds the config this wizard builds
  const [views, setViews] = useState([START_VIEW]) // A list of all views/config blocks we've seen
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, setView] = useAtom(viewInHash) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the config preview

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
    if (!key || typeof key === 'object') key = next

    /*
     * If this is a new view, add it to the list
     */
    const newViews = [...views]
    if (!views.includes(key)) views.push(key)

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
   * Helper method to validate the configuration
   */
  const validateConfiguration = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [result, statusCode] = await api.validateConfiguration(config)
    if (result && statusCode === 200)
      setLoadingStatus([true, 'Configuration validated', true, true])
    else setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])
    setValidationReport(result)
  }

  /*
   * Helper method to figure out what view will be next
   */
  const whatsNext = () => resolveNextView(view, config)

  /*
   * Keep track of what will be the next view to load
   */
  const next = whatsNext()

  return (
    <div className="flex flex-wrap flex-row gap-8 justify-center">
      <div className="w-52">
        <ul className="list list-inside list-disc mt-8">
          {views.map((key) => (
            <li key={key}>
              <button
                className={`btn btn-sm px-1 ${key === view ? 'btn-ghost' : 'btn-link'}`}
                onClick={() => loadView(key)}
              >
                {wizard[key].title || wizard[key].label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full max-w-xl">
        {view === 'validate' ? (
          <>
            <h3>{wizard.validate.label}</h3>
            {validationReport ? (
              <ConfigReport report={validationReport} />
            ) : (
              <Markdown>{wizard.validate.about}</Markdown>
            )}
            <button
              className="btn btn-primary w-full mt-4"
              disabled={!valid || !next}
              onClick={validateConfiguration}
            >
              Validate Configuration
            </button>
          </>
        ) : (
          <>
            <Block
              update={updateConfig}
              configKey={view}
              {...wizard[view]}
              {...{ config, setValid }}
            />
            <button
              className="btn btn-primary w-full mt-4"
              disabled={valid.error}
              onClick={loadView}
            >
              Continue
            </button>
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
        <div className="w-full max-w-lg">
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
