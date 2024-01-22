// Dependencies
import get from 'lodash.get'
import { atomWithLocation } from 'jotai-location'
import { validate, validateConfiguration, iconSize } from 'lib/utils.mjs'
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
import { Yaml } from 'components/yaml.mjs'
import { ConfigReport, DeploymentReport } from './report.mjs'
import { LeftIcon, RightIcon, ConfigurationIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { DiffViewer, diffCheck } from 'components/mconfig/diff.mjs'
import yaml from 'yaml'

/**
 * This React component renders the side menu with a list of various config views
 */
export const ConfigNavigation = ({
  view, // The current view
  nav, // Views for which to render a navigation structure
  loadView, // Method to load a view
  mConf, // The current mConf configuration
  lead = [], // Lead for looking up IDs
}) => (
  <ul className="list list-inside list-disc ml-4">
    {Object.entries(nav)
      .map(([key, val]) =>
        typeof val === 'function' ? { ...val(mConf), id: key } : { ...val, id: key }
      )
      .filter((entry) => !entry.hide)
      .map((entry) => (
        <li key={entry.id}>
          <button
            className={`btn ${
              entry.id === view ? 'btn-ghost' : 'btn-link no-underline hover:underline'
            } px-0 btn-sm`}
            onClick={() => loadView([...lead, entry.id].join('/'))}
          >
            <span className={`${entry.children ? 'uppercase font-bold' : 'capitalize'}`}>
              {entry.title ? entry.title : entry.label}
            </span>
          </button>
          {entry.children && (
            <ConfigNavigation
              {...{ view, loadView, mConf }}
              nav={entry.children}
              lead={[...lead, entry.id]}
            />
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
 * Displays configuration validation
 */
const ShowConfigurationValidation = ({
  api,
  mConf,
  deploy,
  validationReport,
  setValidationReport,
  validateConfiguration,
  setLoadingStatus,
}) => (
  <>
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
        <h3>Validate Configuration</h3>
        <p>
          No changes will be made to your Morio setup at this time.
          <br />
          Instead, the configuration you created will be validated and tested to detect any
          potential issues.
        </p>
        <p className="text-center">
          <button
            className="btn btn-primary w-full"
            onClick={async () =>
              setValidationReport(await validateConfiguration(api, mConf, setLoadingStatus))
            }
          >
            Validate Configuration
          </button>
        </p>
      </>
    )}
  </>
)

/**
 * Displays a block plus navigation
 */
const ShowConfigurationBlock = ({
  updateMConf,
  mConf,
  setValid,
  configPath,
  template,
  section,
  next,
  valid,
  loadView,
  setView,
}) => (
  <>
    <Block
      update={updateMConf}
      {...{ mConf, setValid, configPath, template, section, setView, loadView }}
    />
    {next && (
      <button
        className="btn btn-primary w-full mt-4 flex flex-row gap-2 justify-between"
        disabled={valid.error ? true : !valid}
        onClick={() => loadView(next)}
      >
        Continue
        <div className="flex flex-row gap-2 items-center">
          {template.children?.[next.split('.').pop()]?.label}
          {next === 'validate' ? 'Validate Configuration' : null}
          <RightIcon />
        </div>
      </button>
    )}
    <ul className="list-inside text-sm text-error ml-2 mt-2">
      {
        valid?.error ? (
          valid.error.details.map((err, i) => (
            <li key={i}>
              {err.message.replace(
                'must not be a sparse array item',
                'cannot contain empty values'
              )}
            </li>
          ))
        ) : (
          <li>&nbsp;</li>
        ) /* Always include this to prevent layout-shift */
      }
    </ul>
  </>
)

/**
 * Displays configuration preview (or a button to show it)
 */
const ShowConfigurationPreview = ({ preview, setPreview, mConf }) =>
  preview ? (
    <div className="w-full mt-8">
      <h3>Configuration Preview</h3>
      <Yaml js={mConf} />
      <p className="text-center">
        <button
          onClick={() => setPreview(!preview)}
          className="btn btn-ghost font-normal text-primary"
        >
          Hide configuration preview
        </button>
      </p>
    </div>
  ) : (
    <p className="text-center">
      <button
        onClick={() => setPreview(!preview)}
        className="btn btn-ghost font-normal text-primary"
      >
        Show configuration preview
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
const startView = 'deployment/node_count'

/**
 * This is the React component for the configuration wizard itself
 */
export const ConfigWizard = ({
  prefix = '/config/wizard', // Prefix to use for the keeping the view state in the URL
  page,
}) => {
  /*
   * React state
   */
  const [runningConfig, setRunningConfig] = useState(false) // Holds the current running config
  const [mConf, update, setMConf] = useStateObject({}) // Holds the config this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, _setView] = useAtom(viewInLocation) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the config preview
  const [dense, setDense] = useState(false)
  const [deployResult, setDeployResult] = useState(false)
  const [revert, setRevert] = useState(0)
  const [showDelta, setShowDelta] = useState(false)

  /*
   * Figure out the current configPath from the view
   */
  const configPath = viewAsConfigPath(view.pathname, prefix)

  /*
   * Handler method for view state updates
   */
  const setView = useCallback(
    (configPath) => {
      _setView((prev) => ({
        ...prev,
        pathname: configPathAsView(configPath, prefix),
      }))
    },
    [prefix]
  )

  /*
   * Effect for preloading the view
   */
  useEffect(() => {
    if (view === 'string' && startView !== view) setView(startView)
    else if (view.pathname === '/setup/wizard') setView(startView)
  }, [startView, view, setView])

  /*
   * Effect for loading the running configuration
   */
  useEffect(() => {
    const getRunningConfig = async () => {
      const result = await api.getCurrentConfig()
      if (result[1] === 200 && result[0].deployment) {
        const newMConf = { ...result[0] }
        delete newMConf.services
        delete newMConf.deployment.key_pair
        delete newMConf.core
        setMConf(newMConf)
        setRunningConfig(JSON.parse(JSON.stringify(newMConf)))
      } else console.log('nope', result)
    }
    getRunningConfig()
  }, [revert])

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
    if (key !== 'validate') setValid(validate(key, get(mConf, key), mConf))
    setValidationReport(false)
  }

  /*
   * Helper method to update the configuration and set valid status
   */
  const updateMConf = (val) => {
    /*
     * Always update mConf
     */
    update(configPath, val)

    /*
     * But also run validate
     */
    const valid = validate(`deployment.${section}`, val, mConf)
    setValid(valid, mConf)
  }

  /*
   * Helper method to deploy the configuration
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading configuration'])
    const [data, status] = await api.deploy(mConf)
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

  if (deployResult)
    return (
      <div className="w-fill min-h-screen max-w-2xl mx-auto">
        <DeploymentReport result={deployResult} />
      </div>
    )

  /*
   * Load the template, section, and next
   */
  const section = configPath.split('.').pop()
  const group = configPath.split('.').shift()
  const template = templates[group] ? templates[group]({ mConf }) : false
  const next = template.children?.[section]?.next

  /*
   * Handle config delta
   */
  const delta =
    diffCheck(yaml.stringify(runningConfig), yaml.stringify(mConf)).length > 1 ? true : false

  /*
   * Patch the navigation with an id
   */
  for (const key in template.children) template.children[key].id = `deployment.${key}`

  const showProps =
    section === 'validate'
      ? {
          api,
          mConf,
          deploy,
          validationReport,
          setValidationReport,
          validateConfiguration,
          setLoadingStatus,
        }
      : {
          updateMConf,
          mConf,
          setValid,
          configPath,
          template,
          section,
          next,
          valid,
          loadView,
          setView,
        }

  return (
    <div className="flex flex-row gap-8 justify-start">
      <div className="w-full max-w-4xl p-8 grow">
        <Breadcrumbs page={['config', ...configPath.split('.')]} />
        <div className="w-full">
          <h1 className="capitalize flex w-full max-w-4xl justify-between">
            {template.children?.[section]?.title
              ? template.children[section]?.title
              : template.title
                ? template.title
                : 'Configuration'}
            <ConfigurationIcon className="w-16 h-16" />
          </h1>
          {view.pathname === `${prefix}/validate` ? (
            <ShowConfigurationValidation {...showProps} />
          ) : (
            <ShowConfigurationBlock {...showProps} next={false} />
          )}
          {delta && configPath !== 'validate' ? (
            <Popout note>
              <h4>You have made changes that are yet to be deployed</h4>
              <p>
                The configuration has been edited, and is now different from the currently deployed
                configuration.
              </p>
              {showDelta ? (
                <div className="my-4">
                  <DiffViewer
                    from={yaml.stringify(runningConfig)}
                    to={yaml.stringify(mConf)}
                    fromTitle="Currently deployed configuration"
                    toTitle="Your edits"
                  />
                </div>
              ) : null}
              <div className="flex flex-row flex-wrap gap-2 justify-end w-full">
                <button className="btn btn-warning btn-ghost" onClick={() => setRevert(revert + 1)}>
                  Revert to Running Configuration
                </button>
                <button
                  className="btn btn-primary btn-outline"
                  onClick={() => setShowDelta(!showDelta)}
                >
                  {showDelta ? 'Hide' : 'Show'} Configuration Delta
                </button>
                <button className="btn btn-primary" onClick={() => setView('validate')}>
                  Validate Configuration Changes
                </button>
              </div>
            </Popout>
          ) : null}
          <ShowConfigurationPreview {...{ preview, setPreview, mConf }} />
        </div>
      </div>
      <div className="grow-0 shrink-0 pt-24 min-h-screen">
        <h5>Configuration Blocks</h5>
        <ConfigNavigation view={configPath} loadView={loadView} nav={templates} mConf={mConf} />
      </div>
    </div>
  )
}
