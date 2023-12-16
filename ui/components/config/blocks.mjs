// Dependencies
import get from 'lodash.get'
import { validate } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
import { useTemplate } from 'hooks/use-template.mjs'
// Components
import { ListInput, StringInput } from 'components/inputs.mjs'
import { Popout } from 'components/popout.mjs'
import Markdown from 'react-markdown'
import { PageLink } from 'components/link.mjs'

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
    about = false, // About provided by the configuration schema
    config, // Current configuration
    configKey, // Path to the configuration key we are updating
    input, // Input configuration provided by the configuration schema
    label = false, // Label provided by the configuration schema
    title = false, // Title provided by the configuration schema
    update,
  } = props

  return (
    <>
      {title ? <h3>{title}</h3> : null}
      {!title && label ? <h3>{label}</h3> : null}
      {about ? <Markdown>{about}</Markdown> : null}
      <ListInput {...props} list={input} current={get(config, configKey)} />
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
   * Load templating engine
   */
  const template = useTemplate({ CONFIG: props.config })

  /*
   * Resolve the count value
   */
  const count = Number(template(props.count))

  /*
   * Keep array in local state and update the config as one block
   */
  const [list, setList] = useState(
    get(props.config, props.configKey, [...Array(count).map((val) => '')])
  )

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
    about = false, // About provided by the configuration schema
    config, // Current configuration
    label = false, // Labale provided by the configuration schema
    configKey, // Path to the configuration key we are updating
  } = props

  /*
   * If count is 1 or false, return a single StringBlock
   */
  if (!count || count < 2)
    return (
      <>
        {props.label ? <h3>{props.label}</h3> : null}
        {props.about ? <Markdown>{props.about}</Markdown> : null}
        <StringBlock
          {...props}
          update={(val) => localUpdate(0, val)}
          valid={validate(configKey, list[0])}
          current={list[0]}
          about={false}
          noTitle
          label={template(props.labels, { INDEX: 0, INDEX_PLUS_ONE: 1 })}
        />
      </>
    )

  /*
   * Return count times StringBlock
   */
  return (
    <>
      {props.label ? <h3>{props.label}</h3> : null}
      {props.about ? <Markdown>{props.about}</Markdown> : null}

      {[...Array(count)].map((val, i) => {
        /*
         * Since count is dynamic, the configuration schema
         * can use this dynamic * value to format the labels
         */
        const templateData = { INDEX: i, INDEX_PLUS_ONE: i + 1 }

        return (
          <StringBlock
            {...props}
            key={i}
            about={false}
            noTitle
            label={template(props.labels, templateData)}
            labelTR={template(props.labelsTR, templateData)}
            labelBL={template(props.labelsBL, templateData)}
            labelBR={template(props.labelsBR, templateData)}
            update={(val) => localUpdate(i, val)}
            valid={(val) => validate(configKey, val)}
            current={list[i]}
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
    about = false, // About provided by the configuration schema
    config, // Current configuration
    input = [], // input provided by the the configuration schema
    label = false, // Labale provided by the configuration schema
    noTitle = false, // You can use this to suppress the title
    configKey, // Path to the configuration key we are updating
    placeholder = false, // Placeholder provided by the configuration schema
  } = props

  return (
    <>
      {label && !noTitle ? <h3>{label}</h3> : null}
      {about ? <Markdown>{about}</Markdown> : null}
      <StringInput
        key={configKey}
        current={get(config, configKey)}
        {...props}
        list={input}
        placeholder={placeholder}
        valid={(val) => validate(configKey, val)}
      />
    </>
  )
}
