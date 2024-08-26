import React, { Fragment } from 'react'
import Markdown from 'react-markdown'
import {
  StringInput,
  TextInput,
  NumberInput,
  ToggleInput,
  ListInput,
  SliderInput,
  HiddenInput,
} from 'components/inputs.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import Joi from 'joi'
import get from 'lodash.get'
import set from 'lodash.set'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { Progress } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import { CloseIcon, TrashIcon } from 'components/icons.mjs'
import { TokenSelect } from './tokens.mjs'

export const loadFormDefaults = (defaults, form) => {
  if (typeof form === 'function') form = form({})
  if (!Array.isArray(form)) return loadFormDefaults(defaults, [form])
  for (let el of form) {
    if (typeof el === 'function') el = el({})
    if (Array.isArray(el)) loadFormDefaults(defaults, el)
    if (typeof el === 'object') {
      if (el.tabs) {
        for (const tab in el.tabs) loadFormDefaults(defaults, el.tabs[tab])
      }
      if (el.key && el.dflt !== undefined) set(defaults, el.key, el.dflt)
      if (el.hidden && el.current !== undefined) set(defaults, el.key, el.current)
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
  const { update, formValidation, updateFormValidation, freeze = false } = props
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
              <Tabs
                {...formEl}
                key={i}
                tabs={Object.keys(formEl.tabs).join()}
                navs={formEl.navs === false ? false : true}
              >
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
                {...formEl}
                key={i}
                update={(val) => _update(val, formEl.key, formEl.transform)}
                current={get(props.data, formEl.key, formEl.current)}
                id={formEl.key}
                {...{ formValidation, updateFormValidation, freeze }}
                mSettings={props.mSettings}
              />
            )
          if (React.isValidElement(formEl)) return <Fragment key={i}>{formEl}</Fragment>
          if (formEl.hidden)
            return (
              <FormElement
                {...formEl}
                key={i}
                update={(val) => _update(val, formEl.key, formEl.transform)}
                current={get(props.data, formEl.key, formEl.current)}
                id={formEl.key}
              />
            )
          else return <p key={i}>formEl.schema is no schema</p>
        }
        if (typeof formEl === 'function')
          return <FormBlock {...props} form={formEl(props)} key={i} />
        else return <p key={i}>Not sure what to do with {i}</p>
      })}
    </>
  )
}

export const FormElement = (props) => {
  const { schema, formValidation, updateFormValidation, freeze = false } = props
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
      ? () => true
      : (val) => {
          const result = validate(val, schema, props.id)
          const newValid = result.error ? false : true
          if (formValidation && formValidation[props.id] !== newValid)
            updateFormValidation(props.id, newValid)

          return result
        },
  }
  if (freeze && freeze.includes(props.id)) inputProps.disabled = true

  if (props.inputType === 'buttonList') return <ListInput {...inputProps} />
  if (props.inputType === 'toggle') return <ToggleInput {...inputProps} />
  if (props.inputType === 'slider') return <SliderInput {...inputProps} />
  if (props.inputType === 'textarea') return <TextInput {...inputProps} />
  if (props.inputType === 'secret') return <TokenSelect {...inputProps} secrets={true} />
  if (props.inputType === 'variable') return <TokenSelect {...inputProps} secrets={false} />

  switch (type) {
    case 'string':
      return <StringInput {...inputProps} />
    case 'number':
      return <NumberInput {...inputProps} />
    case 'boolean':
      return <ToggleInput {...inputProps} />
    case 'hidden':
      return <HiddenInput {...inputProps} />
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
export const runFormValidation = (form, data = {}) => {
  if (typeof form === 'function') form = form(data)
  const result = {}
  for (const el of form) getFormValidation(el, data, result)

  return result
}

const formValidationReducer = (result) => {
  for (const val of Object.values(result)) {
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
export const reduceFormValidation = (form, data = {}) =>
  formValidationReducer(runFormValidation(form, data))

export const FormWrapper = (props) => {
  // Should we maintain this data locally?
  const { local = false } = props
  const [data, update] = useStateObject(props.defaults) // Holds the data this form builds

  // Run form validation and count how much is done
  const formValidation = runFormValidation(props.form, data)
  const done =
    Object.values(formValidation).filter((el) => el === true).length *
    (100 / Object.values(formValidation).length)

  /*
   * This takes the local data and stores it in MSettings
   */
  const applyLocal = () => {
    props.update(props.local(data), data)
    props.popModal()
  }

  return (
    <>
      <FormBlock
        {...props}
        data={local ? data : props.data}
        update={local ? update : props.update}
        mSettings={local ? props.data : false}
      />
      {props.readOnly ? (
        <button className="btn btn-primary btn-outline w-full" onClick={() => props.popModal()}>
          Close
        </button>
      ) : null}
      {props.local && props.action ? (
        <>
          <Progress value={done} />
          <LocalButtons
            local={props.local}
            action={props.action}
            popModal={props.popModal}
            pushModal={props.pushModal}
            applyLocal={applyLocal}
            removeLocal={props.removeLocal}
          />
        </>
      ) : null}
    </>
  )
}

const LocalButtons = ({ local, action, popModal, applyLocal, removeLocal }) => {
  if (!local) return null

  return action === 'create' ? (
    <div className="grid grid-cols-8 gap-2 my-3">
      <button className="btn btn-primary w-full col-span-7" onClick={applyLocal}>
        Create
      </button>
      <button className="btn btn-neutral btn-outline w-full" onClick={() => popModal()}>
        <CloseIcon stroke={3} />
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-8 gap-2 my-3">
      <button
        className="btn btn-error w-full"
        onClick={removeLocal ? removeLocal : null}
        disabled={removeLocal ? false : true}
      >
        <TrashIcon />
      </button>
      <button className="btn btn-primary w-full col-span-6" onClick={applyLocal}>
        Update
      </button>
      <button className="btn btn-neutral btn-outline w-full" onClick={() => popModal()}>
        <CloseIcon stroke={3} />
      </button>
    </div>
  )
}
