// Dependencies
import get from 'lodash.get'
import { template, validate } from 'lib/utils.mjs'
// Hooks
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ListInput, StringInput } from 'components/inputs.mjs'
import Markdown from 'react-markdown'

/*
 * A component to merely display info
 *
 * @param {object} props - Props for the component
 * @return {function} Component - React component
 */
export const InfoBlock = (props) => {
  const {
    about = false, // About provided by the configuration schema
    label = false, // Label provided by the configuration schema
    title = false, // Title provided by the configuration schema
  } = props.viewConfig

  return (
    <>
      {title ? <h3>{title}</h3> : null}
      {!title && label ? <h3>{label}</h3> : null}
      {about ? <Markdown>{about}</Markdown> : null}
    </>
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
    config, // Current configuration
    viewConfig, // View configuration
  } = props

  return (
    <>
      {viewConfig.title ? <h3>{viewConfig.title}</h3> : null}
      {!viewConfig.title && viewConfig.label ? <h3>{viewConfig.label}</h3> : null}
      {viewConfig.about ? <Markdown>{viewConfig.about}</Markdown> : null}
      <ListInput {...props} list={viewConfig.input} current={get(config, viewConfig.id)} />
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
  const count = Number(template(props.viewConfig.count, { CONFIG: props.config }))

  /*
   * Keep array in local state and update the config as one block
   */
  const [list, setList] = useState(
    get(props.config, props.viewConfig.id, [...Array(count).map(() => '')])
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
    config, // Current configuration
    viewConfig, // The view configuration
  } = props

  /*
   * Deconstruct the viewConfig properties we use, and detail what they are about
   */
  const {
    about = false, // About provided by the configuration schema
    label = false, // Labale provided by the configuration schema
    id, // Path to the configuration key we are updating
  } = viewConfig

  /*
   * If count is 1 or false, return a single StringBlock
   */
  if (!count || count < 2)
    return (
      <>
        <StringBlock
          {...props}
          update={(val) => localUpdate(0, val)}
          valid={validate(id, list[0])}
          current={list[0]}
          about={false}
          noTitle
          label={template(viewConfig.labels, { INDEX: 0, INDEX_PLUS_ONE: 1, CONFIG: props.config })}
        />
      </>
    )

  /*
   * Return count times StringBlock
   */
  return (
    <>
      {label ? <h3>{label}</h3> : null}
      {about ? <Markdown>{about}</Markdown> : null}

      {[...Array(count)].map((val, i) => {
        /*
         * Since count is dynamic, the configuration schema
         * can use this dynamic * value to format the labels
         */
        const templateData = { INDEX: i, INDEX_PLUS_ONE: i + 1, CONFIG: config }

        return (
          <StringBlock
            {...props}
            key={i}
            about={false}
            noTitle={true}
            label={template(viewConfig.labels, templateData)}
            labelTR={template(viewConfig.labelsTR, templateData)}
            labelBL={template(viewConfig.labelsBL, templateData)}
            labelBR={template(viewConfig.labelsBR, templateData)}
            update={(val) => localUpdate(i, val)}
            valid={(val) => validate(id, val)}
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
    config, // Current configuration
    viewConfig, // The view configuration
    noTitle = false, // You can use this to suppress the title
  } = props
  const {
    about = false, // About provided by the configuration schema
    input = [], // input provided by the the configuration schema
    label = false, // Labale provided by the configuration schema
    id, // Path to the configuration key we are updating
    placeholder = false, // Placeholder provided by the configuration schema
  } = viewConfig

  return (
    <>
      {label && !noTitle ? <h3>{label}</h3> : null}
      {about && !noTitle ? <Markdown>{about}</Markdown> : null}
      <StringInput
        key={id}
        current={get(config, id)}
        {...props}
        list={input}
        placeholder={placeholder}
        valid={(val) => validate(id, val)}
      />
      {viewConfig.suggest ? <Suggestion {...props} /> : null}
    </>
  )
}

/*
 * A component to handle suggestions
 */
export const Suggestion = (props) => {
  const [data, setData] = useState(null)
  const { api } = useApi()
  const sconf = props.viewConfig.suggest

  const macros = {
    validateNode: {
      call: () => api.validateNode(props.config?.morio?.nodes?.[0]),
      render: ({ data }) =>
        data.this_morio_node ? (
          <div className="p-4 border-accent border-dashed border rounded-lg mt-4 bg-accent bg-opacity-20">
            <h6>Suggested IP addresses</h6>
            <p>Based on the hostname you entered, we estimate this is a good choice:</p>
            <div className="flex flex-row flex-wrap gap-2 items-center">
              {data.ips.map((ip) => (
                <button key={ip} className="btn btn-info btn-sm">{ip}</button>
              ))}
            </div>
          </div>
        ) : null,
    },
  }

  useEffect(() => {
    const runMacro = async () => {
      if (sconf.macro && macros[sconf.macro]) {
        const result = await macros[sconf.macro].call()
        if (result[1] === 200) setData(macros[sconf.macro].render({ data: result[0] }))
      }
    }
    if (data === null) runMacro()
  }, [props.viewConfig])

  return data
}
