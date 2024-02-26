import React, { useState, Fragment } from 'react'
import Markdown from 'react-markdown'
import {
  StringInput,
  SecretInput,
  TextInput,
  NumberInput,
  ToggleInput,
  ListInput,
  SliderInput,
} from 'components/inputs.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import Joi from 'joi'
import get from 'lodash.get'
import set from 'lodash.set'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { Progress } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import { CloseIcon, TrashIcon } from 'components/icons.mjs'

export const loadFormDefaults = (defaults, form) => {
  if (!Array.isArray(form)) return loadFormDefaults(defaults, [form])
  for (const el of form) {
    if (Array.isArray(el)) loadFormDefaults(defaults, el)
    if (typeof el === 'object') {
      if (el.tabs) {
        for (const tab in el.tabs) loadFormDefaults(defaults, el.tabs[tab])
      }
      if (el.key && el.dflt !== undefined) set(defaults, el.key, el.dflt)
    }
  }

  return defaults
}

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
  const { update, formValidation, updateFormValidation } = props
  // Ensure form is always an array
  const form = Array.isArray(props.form) ? props.form : [props.form]

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
          if (formEl.hidden)
            return (
              <FormElement
                key={i}
                {...formEl}
                update={(val) => _update(val, formEl.key, formEl.transform)}
                current={get(props.data, formEl.key, formEl.current)}
                id={formEl.key}
              />
            )
          else return <p key={i}>formEl.schema is no schema</p>
        }
        if (typeof formEl === 'function') return <FormBlock {...props} form={formEl(props)} />
        else return <p key={i}>Not sure what to do with {i}</p>
      })}
    </>
  )
}

export const FormElement = (props) => {
  const { schema, update, formValidation, updateFormValidation } = props
  if (!Joi.isSchema(schema) && !props.hidden)
    return (
      <Popout fixme>
        The JoiFormElement component expexts a Joi schema to be passed as the schema prop
      </Popout>
    )
  const type = props.hidden ? 'hidden' : schema.type

  const inputProps = {
    ...props,
    valid: props.hidden
      ? (val) => true
      : (val) => {
          const result = validate(val, schema, props.id)
          const newValid = result.error ? false : true
          if (formValidation && formValidation[props.id] !== newValid)
            updateFormValidation(props.id, newValid)

          return result
        },
  }

  if (props.inputType === 'buttonList') return <ListInput {...inputProps} />
  if (props.inputType === 'toggle') return <ToggleInput {...inputProps} />
  if (props.inputType === 'slider') return <SliderInput {...inputProps} />
  if (props.inputType === 'textarea') return <TextInput {...inputProps} />
  if (props.inputType === 'password') return <SecretInput {...inputProps} />

  switch (type) {
    case 'string':
      return <StringInput {...inputProps} />
    case 'number':
      return <NumberInput {...inputProps} />
    case 'boolean':
      return <ToggleInput {...inputProps} />
    default:
      return <p>Unknown type: {type}</p>
  }
}

/*
 * Run form validation in a way that allows recursion
 */
const getFormValidation = (el, data, result) => {
  if (typeof el === 'object') {
    if (Array.isArray(el)) for (const sel of el) getFormValidation(sel, data, result)
    if (el.tabs) for (const tab of Object.values(el.tabs)) getFormValidation(tab, data, result)
    if (el.schema && el.key) {
      const valid = el.schema.validate(get(data, el.key))
      set(result, el.key, valid?.error ? false : true)
    }
  }

  return result
}

/*
 * Top-level form validation method
 */
export const runFormValidation = (form, data) => {
  const result = {}
  for (const el of form) getFormValidation(el, data, result)

  return result
}

const formValidationReducer = (result) => {
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'object') {
      const valid = formValidationReducer(val)
      if (!valid) return false
    } else if (val !== true) return false
  }

  return true
}

/*
 * Return a simple true/false for an entire form validation
 * Typically used to enable/disable submit buttons
 */
export const reduceFormValidation = (form, data) =>
  formValidationReducer(runFormValidation(form, data))

export const FormWrapper = (props) => {
  // Should we maintain this data locally?
  const { local = false, defaults = {} } = props
  const [data, update, setData] = useStateObject(props.defaults) // Holds the data this form builds

  // Run form validation and count how much is done
  const formValidation = runFormValidation(props.form, data)
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
            local({ ...props.defaults, ...data }),
            typeof props.transform === 'function'
              ? props.transform(data)
              : { ...defaults, ...data },
            props.data
          )
        }
      : undefined

  /*
   * This takes the local data and stores it in MSettings
   */
  const applyLocal = () => {
    props.update(props.local(data), data)
    props.setModal(false)
  }

  /*
   * This takes the local data and stores it in MSettings
   */
  const removeLocal = (remove = false) => {
    props.update(props.local(data), 'MORIO_UNSET')
    props.setModal(false)
  }

  return (
    <>
      <FormBlock
        {...props}
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
      {props.local && props.action ? (
        <>
          <Progress value={done} />
          <LocalButtons
            local={props.local}
            action={props.action}
            setModal={props.setModal}
            applyLocal={applyLocal}
            removeLocal={removeLocal}
          />
        </>
      ) : null}
    </>
  )
}

const LocalButtons = ({ local, action, setModal, applyLocal, removeLocal }) => {
  if (!local) return null

  return action === 'create' ? (
    <div className="grid grid-cols-8 gap-2 my-3">
      <button className="btn btn-primary w-full col-span-7" onClick={applyLocal}>
        Create
      </button>
      <button className="btn btn-neutral btn-outline w-full" onClick={() => setModal(false)}>
        <CloseIcon stroke={3} />
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-8 gap-2 my-3">
      <button className="btn btn-error w-full" onClick={removeLocal}>
        <TrashIcon />
      </button>
      <button className="btn btn-primary w-full col-span-6" onClick={applyLocal}>
        Update
      </button>
      <button className="btn btn-neutral btn-outline w-full" onClick={() => setModal(false)}>
        <CloseIcon stroke={3} />
      </button>
    </div>
  )
}
