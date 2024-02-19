import React, { useState, Fragment } from 'react'
import Markdown from 'react-markdown'
import {
  StringInput,
  SecretInput,
  TextInput,
  NumberInput,
  ToggleInput,
  ListInput,
} from 'components/inputs.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import Joi from 'joi'
import get from 'lodash.get'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { Progress } from 'components/animations.mjs'

/**
 * A method to provide validation based on the Joi validation library
 *
 * Since we are only validating 1 field at a time, rather than the entire
 * config, we need to extract that field from the config schema. However, doing
 * so will break in-schema references, as they now fall outside of the schema
 * root. To fix that, you should pass the entire config object to this method
 * so it can be used to resolve those references.
 *
 * @param {string} key - Key to lookup in the schema
 * @param {any} value - Value to validate against the schema
 * @param {object} config - Config that will server as context to resolve schema references
 * @return {object} result - The Joi validation result object
 */
const validate = (value, schema, label) => {
  let result = true
  try {
    result = schema.validate(value, { label })
  } catch (err) {
    return false
  }

  return result
}

export const FormBlock = (props) => {
  const { form, update, formValidation, updateFormValidation } = props

  /*
   * Local update handles some extra checks and passes in data object
   */
  const _update = (val, path, transform = false) => {
    if (typeof transform === 'function') update(path, transform(val), props.data)
    else update(path, val, props.data)
  }

  return (
    <>
      {form.map((formEl, i) => {
        if (Array.isArray(formEl))
          return (
            <div className="grid grid-cols-2 gap-2" key={i}>
              <FormBlock {...props} form={formEl} />
            </div>
          )
        if (typeof formEl === 'string')
          return (
            <div className="mdx" key={i}>
              <Markdown key={i}>{formEl}</Markdown>
            </div>
          )
        if (typeof formEl === 'object') {
          if (formEl.tabs)
            return (
              <Tabs {...formEl} tabs={Object.keys(formEl.tabs).join()} navs key={i}>
                {Object.keys(formEl.tabs).map((key) => (
                  <Tab key={key} tabId={key}>
                    <FormBlock {...props} form={formEl.tabs[key]} />
                  </Tab>
                ))}
              </Tabs>
            )
          if (Joi.isSchema(formEl.schema))
            return (
              <FormElement
                key={i}
                {...formEl}
                update={(val) => _update(val, formEl.key, formEl.transform)}
                current={get(props.data, formEl.key, formEl.current)}
                id={formEl.key}
                {...{ formValidation, updateFormValidation }}
              />
            )
          if (React.isValidElement(formEl)) return <Fragment key={i}>{formEl}</Fragment>
          else return <p key={i}>formEl.schema is no schema</p>
        } else return <p key={i}>Not sure what to do with {i}</p>
      })}
    </>
  )
}

export const FormElement = (props) => {
  const { schema, update, formValidation, updateFormValidation } = props
  if (!Joi.isSchema(schema))
    return (
      <Popout fixme>
        The JoiFormElement component expexts a Joi schema to be passed as the schema prop
      </Popout>
    )
  const type = schema.type

  const inputProps = {
    ...props,
    valid: (val) => {
      const result = validate(val, schema, props.id)
      const newValid = result.error ? false : true
      if (formValidation && formValidation[props.id] !== newValid)
        updateFormValidation(props.id, newValid)

      return result
    },
  }

  if (props.inputType === 'buttonList') return <ListInput {...inputProps} />

  switch (type) {
    case 'string':
      return props.textarea ? (
        <TextInput {...inputProps} />
      ) : props.secret ? (
        <SecretInput {...inputProps} />
      ) : (
        <StringInput {...inputProps} />
      )
      break
    case 'number':
      return <NumberInput {...inputProps} />
    case 'boolean':
      return <ToggleInput {...inputProps} />
    default:
      return <p>Unknown type: {type}</p>
  }
}

export const FormWrapper = (props) => {
  // Should we maintain this data locally?
  const { local = false } = props
  const [data, update, setData] = useStateObject(props.settings || {}) // Holds the config this form builds
  const [formValidation, setFormValidation] = useState({})

  const updateFormValidation = (key, valid) => {
    const result = { ...formValidation }
    result[key] = valid
    setFormValidation(result)
  }
  const done =
    Object.values(formValidation).filter((el) => el === true).length *
    (100 / Object.values(formValidation).length)

  /*
   * Global update to Msettings handles some extra checks and passes in data
   */
  const process =
    typeof local === 'function'
      ? () => {
          if (props.setModal) props.setModal(false)
          props.update(
            local(data),
            typeof props.transform === 'function' ? props.transform(data) : data,
            props.data
          )
        }
      : undefined

  return (
    <>
      <FormBlock
        {...props}
        {...{ formValidation, updateFormValidation }}
        data={local ? data : props.data}
        update={local ? update : props.update}
      />
      {props.readOnly ? (
        <button
          className="btn btn-primary btn-outline w-full"
          onClick={() => props.setModal(false)}
        >
          Close
        </button>
      ) : null}
    </>
  )
}
