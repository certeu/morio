// Dependencies
import get from 'lodash.get'
import { validators } from './validators.mjs'
// Hooks
import { useState } from 'react'
// Components
import { ListInput, StringInput } from 'components/inputs.mjs'
import { Popout } from 'components/popout.mjs'
import Markdown from 'react-markdown'
import { PageLink } from 'components/link.mjs'
import mustache from 'mustache'

/*
 * A wrapper component for all configuration blocks
 *
 * This will return a specific block based on the type and pass down props
 *
 * @param {object} props - Props to pass down
 * @return {function} Component - React component
 */
export const Block = (props) => {
  if (props.type === 'list') return <ListBlock {...props} />
  if (props.type === 'string') return <StringBlock {...props} />
  if (props.type === 'strings') return <StringsBlock {...props} />

  return (
    <Popout warning>
      <p>fixme: Invalid block type</p>
    </Popout>
  )
}

/*
 * A component to select something from a list
 *
 * @param {object} props - Props for the component
 * @return {function} Component - React component
 */
export const ListBlock = (props) => {
  const {
    about=false, // About provided by the configuration schema
    config, // Current configuration
    configKey, // Path to the configuration key we are updating
    input, // Input configuration provided by the configuration schema
    label=false, // Labal provided by the configuration schema
    update,
  } = props

  return (
    <>
      {label ? <h2>{label}</h2> : null}
      {about ? <Markdown>{about}</Markdown> : null}
      <ListInput
        {...props}
        list={input}
        current={get(config, configKey)}
      />
    </>
  )
}

/*
 * A component to input mulitple strings
 *
 * @param {object} props - Props for the component
 * @return {function} Component - React component
 */
export const StringsBlock = (props) => {
  /*
   * Resolve the count value
   */
  const count = resolveCount(props.count, props.config)

  /*
   * Keep array in local state and update the config as one block
   */
  const [list, setList] = useState([...Array(count).map(val => '')])

  /*
   * Helper method to update one array instance
   */
  const localUpdate = (index, val) => {
    const newList = [...list]
    newList[index] = val
    setList(newList)
    props.update(newList)
  }

  /*
   * Deconstruct the props we use, and detail what they are about
   */
  const {
    about=false, // About provided by the configuration schema
    config, // Current configuration
    label=false, // Labale provided by the configuration schema
    configKey, // Path to the configuration key we are updating
  } = props

  /*
   * If count is 1 or false, return a single StringBlock
   */
  if (!count || count < 2) return (
    <>
      {props.label ? <h2>{props.label}</h2> : null}
      {props.about ? <Markdown>{props.about}</Markdown> : null}
      <StringBlock
        {...props}
        update={(val) => localUpdate(0, val)}
        valid={validators[configKey]}
        current={list[0]}
      />
    </>
  )

  /*
   * Return count times StringBlock
   */
  return (
    <>
      {props.label ? <h2>{props.label}</h2> : null}
      {props.about ? <Markdown>{props.about}</Markdown> : null}
      {list.map((val, i) => {
        /*
         * Since count is dynamic, the configuration schema
         * can use this dynamic * value to format the labels
         */
        const template = input => input
          ? mustache.render(input, { INDEX: i, INDEX_PLUS_ONE: i+1 })
          : ''

        return (
          <StringBlock
            {...props}
            key={i}
            about={false}
            noTitle
            label={template(props.labels)}
            labelTR={template(props.labelsTR)}
            labelBL={template(props.labelsBL)}
            labelBR={template(props.labelsBR)}
            update={(val) => localUpdate(i, val)}
            valid={validators[configKey]}
            current={val}
          />
        )
      })}
    </>
  )
}

/*
 * A component to input a strings
 *
 * @param {object} props - Props for the component
 * @return {function} Component - React component
 */
export const StringBlock = (props) => {
  const {
    about=false, // About provided by the configuration schema
    config, // Current configuration
    input=[], // input provided by the the configuration schema
    label=false, // Labale provided by the configuration schema
    noTitle=false, // You can use this to suppress the title
    configKey, // Path to the configuration key we are updating
    placeholder=false, // Placeholder provided by the configuration schema
  } = props

  return (
    <>
      {label && !noTitle ? <h2>{label}</h2> : null}
      {about ? <Markdown>{about}</Markdown> : null}
      <StringInput
        current={get(config, configKey)}
        {...props}
        list={input}
        placeholder={placeholder}
      />
    </>
  )
}

/*
 * Helper method to resolve a count value
 *
 * @param {number|string} count - The count value in the configuration schema
 * @param {object} config - The current configuration
 */
function resolveCount (count, config) {
  /*
   * If it's a simple number, that's easy
   */
  if (typeof count === 'number') return count

  /*
   * If it starts with 'config:' lookup the value in the config
   */
  if (count.slice(0,7) === 'config:') return get(config, count.slice(7).trim())

  /*
   * This means we cannot figure it out, so return false
   * and let the component handle it.
   */
  return false
}
