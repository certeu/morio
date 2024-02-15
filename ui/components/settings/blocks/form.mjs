import React, { useState } from 'react'
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

  return (
    <>
      {form.map((val, i) => {
        if (Array.isArray(val))
          return (
            <div className="grid grid-cols-2 gap-2">
              <FormBlock {...props} form={val} />
            </div>
          )
        if (typeof val === 'string') return <Markdown key={i}>{val}</Markdown>
        if (typeof val === 'object') {
          if (val.tabs)
            return (
              <Tabs {...val} tabs={Object.keys(val.tabs).join()} navs>
                {Object.keys(val.tabs).map((key) => (
                  <Tab key={key} tabId={key}>
                    <FormBlock {...props} form={val.tabs[key]} />
                  </Tab>
                ))}
              </Tabs>
            )
          if (Joi.isSchema(val.schema))
            return (
              <FormElement
                {...val}
                update={(input) =>
                  typeof val.transform === 'function'
                    ? props.update(val.key, val.transform(input))
                    : props.update(val.key, input)
                }
                current={get(props.data, val.key, val.current)}
                id={val.key}
                {...{ formValidation, updateFormValidation }}
              />
            )
          if (React.isValidElement(val)) return val
          else return <p>val.schema is no schema</p>
        } else return <p>Not sure what to do with {i}</p>
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

  return (
    <>
      <FormBlock {...props} {...{ update, formValidation, updateFormValidation, data }} />
      {props.readOnly ? (
        <button
          className="btn btn-primary btn-outline w-full"
          onClick={() => props.setModal(false)}
        >
          Close
        </button>
      ) : (
        <>
          {formValidation ? <Progress value={done} /> : null}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              className={`btn btn-primary w-full ${
                props.setModal ? 'col-span-2' : 'col-span-1 col-start-2'
              }`}
              disabled={done < 100}
              onClick={() => {
                if (props.setModal) props.setModal(false)
                props.update(`${props.group}.${props.section}${data.id ? '.' + data.id : ''}`, data)
              }}
            >
              Save
            </button>
            {props.setModal ? (
              <button
                className="btn btn-primary btn-outline w-full"
                onClick={() => props.setModal(false)}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </>
      )}
    </>
  )
}
