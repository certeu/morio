// Dependencies
import schema from './schema.yaml'
import { validators } from './validators.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
// Components
import Markdown from 'react-markdown'
import { Block } from './blocks.mjs'
import { PageLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Yaml } from 'components/yaml.mjs'


export const ConfigurationWizard = () => {
  /*
   * React state
   */
  const [config, update] = useStateObject()
  const [blocks, setBlocks] = useState(['init'])
  const [blockIndex, setBlockIndex] = useState(0)
  const [next, setNext] = useState(false)
  const [valid, setValid] = useState(false)
  const [validatedConfiguration, setValidatedConfiguration] = useState(false)

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
  const configKey = schema[blockName].configKey || blockName

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
      setNext(next)
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
    if (result && statusCode === 200) {
      setLoadingStatus([true, 'Configuration validated', true, true])
      setValidatedConfiguration([true, result])
    } else {
      setLoadingStatus([true, `Morio API returned an error [${statusCode}]`, true, false])
      setValidatedConfiguration([false])
    }
  }

  return (
    <>
      <div className="text-left">
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
        {blocks.length > 1 && (
          <>
            <h4 className="mt-12">Configuration Blocks</h4>
            <ul className="list list-inside list-disc">
              {blocks.map(key => (
                <li key={key}>
                  <button
                    className={`btn btn-sm ${blocks.indexOf(key) === blockIndex ? 'btn-ghost' : 'btn-link'}`}
                    onClick={() => setBlockIndex(blocks.indexOf(key))}
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


