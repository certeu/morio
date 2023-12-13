// Dependencies
import schema from './schema.yaml'
import { validators } from './validators.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useTemplate } from 'hooks/use-template.mjs'
// Components
import Markdown from 'react-markdown'
import { Block } from './blocks.mjs'
import { PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Yaml } from 'components/yaml.mjs'
import { OkIcon, WarningIcon } from 'components/icons.mjs'


export const ConfigurationWizard = () => {
  /*
   * React state
   */
  const [config, update] = useStateObject()
  const [blocks, setBlocks] = useState(['init'])
  const [blockIndex, setBlockIndex] = useState(0)
  const [next, setNext] = useState(false)
  const [valid, setValid] = useState(false)
  const [validationReport, setValidationReport] = useState(false)

  /*
   * Hooks
   */
  const template = useTemplate(config)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus, loading, LoadingProgress } = useContext(LoadingStatusContext)

  /*
   * Store the name of this block so in a more intuitive name
   */
  const blockName = blocks[blockIndex]

  /*
   * The configuration key is the blockName unless it's specified explicitly
   */
  const configKey = schema[blockName]?.configKey || blockName

  /*
   * If no validator is available for the configuration key the block is
   * updating, return an error because that's not right
   */
  if (typeof validators[configKey] !== 'function') return (
    <Popout error>
      <h5>No validator is available for this configuration path</h5>
      <p>This block controls the <code>{configKey}</code> configuration key, but no validator is available for this key.</p>
      <p>This can lead to invalid configuration entries, so out of caution we will not proceed.</p>
      <p>As this is an unexpected error, we recommend to <PageLink href="/support">report this through support</PageLink></p>
    </Popout>
  )

  /*
   * Helper method to load the next configuration block into the wizard
   */
  const nextBlock = () => {
    const newBlocks = [...blocks]
    if (!blocks.includes(next)) blocks.push(next)
    setBlockIndex(blocks.indexOf(next))
    setValid(false)
  }

  /*
   * Helper method to load the next configuration block into the wizard
   */
  const loadBlock = (key) => {
    const newBlocks = [...blocks]
    if (!blocks.includes(key)) blocks.push(key)
    setBlockIndex(blocks.indexOf(key))
    setNext(resolveNext(key, config, template))
    setValid(false)
  }

  /*
   * Helper method to update the configuration if and only if validation passes
   */
  const updateWhenValid = (val) => {
    /*
     * Run the validator
     */
    const [valid, next] = validators[configKey](val, config)
    if (valid) {
      /*
       * Looks good, update the configuration and set the next block
       */
      update(configKey, val)
      setValid(valid)
      setNext(resolveNext(next, config, template))
    } else {
      /*
       * Validation failed. Do not update configuration, and set valid to false.
       */
      setValid(false)
    }
  }

  /*
   * Helper method to validate the configuration
   */
  const validateConfiguration = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [ result, statusCode ] = await api.validateConfiguration(config)
    if (result && statusCode === 200) setLoadingStatus([true, 'Configuration validated', true, true])
    else setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])
    setValidationReport(result)
    setNext('MORIO_POST_VALIDATION')
  }

  return (
    <>
      <div className="text-left">
        {next === 'MORIO_POST_VALIDATION' ? (
          <>
            <h2>Configuration Validation</h2>
            <ConfigReport report={validationReport} />
          </>
        ) : (
          <>
            <Block
              update={updateWhenValid}
              {...schema[blockName]}
              {...{ config, setValid, setNext, configKey }}
            />
            {next === 'MORIO_VALIDATE_CONFIG' ? (
              <button
                className="btn btn-primary w-full mt-4"
                disabled={!valid || !next}
                onClick={validateConfiguration}
              >Validate Configuration</button>
            ) : (
              <button
                className="btn btn-primary w-full mt-4"
                disabled={!valid || !next}
                onClick={nextBlock}
              >Continue</button>
            )}
          </>
        )}
        {blocks.length > 1 && (
          <>
            <h4 className="mt-12">Configuration Blocks</h4>
            <ul className="list list-inside list-disc">
              {blocks.map(key => (
                <li key={key}>
                  <button
                    className={`btn btn-sm ${blocks.indexOf(key) === blockIndex ? 'btn-ghost' : 'btn-link'}`}
                    onClick={() => loadBlock(key)}
                  >
                    {schema[key].label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <h4 className="mt-12">Configuration Preview</h4>
        <Yaml js={config} />
      </div>
    </>
  )
}

/**
 * A React component to display a configuration report
 *
 * @param {object} report - The report object returns from the API
 * @return {functino} component - The React component
 */
const ConfigReport = ({ report }) => (
  <>
    <Box color={report.valid  ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <h6 className="text-inherit">
          This configuration
          {report.valid ? <span> is </span> : <b className="px-1 underline">is NOT</b>}
          valid
        </h6>
      </div>
    </Box>
    <Box color={report.valid  ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <h6 className="text-inherit">
          This configuration
          {report.valid ? <span> can </span> : <b className="px-1 underline">CANNOT</b>}
          be deployed
        </h6>
      </div>
    </Box>
    {['errors', 'warnings', 'info'].map(type => report[type].length > 0 ? (
      <div key={type}>
        <h3>Validation {type}</h3>
        <Messages list={report[type]} />
      </div>
    ) : null )}
  </>
)
const Messages = ({ list }) => (
  <ul className="list list-disc list-inside pl-4">
    {list.map((msg, i) => <li key={i}>{msg}</li>)}
  </ul>
)

/**
 * Little helper component to display a box in the report
 */
const Box = ({ color, children}) => (
  <div className={`bg-${color} text-${color}=content rounded-lg p-4 w-full bg-opacity-80 shadow mb-2`}>
    {children}
  </div>
)

/*
 * A helper function to resolve the next value
 *
 * @param {string|number|object} next - The next key in the schema
 * @param {object} config - The configuration from React state
 * @param {function} template - The template method
 * @return {string} next - The resolve next value
 */
function resolveNext(next, config, template)  {
  if (typeof next !== 'object') return next

  if (next.if) {
    /*
     * First resolve the value to check
     */
    const check = resolveValue(next.if, config, template)
    /*
     * Now check it against the condition
     */
    if (check === next.if.is) return template(next.then, { CONFIG: config })
    else return template(next.else, { CONFIG: config })
  }

  return false
}

function resolveValue(input, config, template) {
  let val = input
  if (typeof input === 'object') {
    val = template(input.val, { CONFIG: config})
    if (['number', 'string'].includes(input.as)) {
      if (input.as === 'number') val = Number(val)
      if (input.as === 'string') val = String(val)
    }
  }
  else val = template(input, { CONFIG: config })

  return val
}
