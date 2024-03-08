import { useState, useContext } from 'react'
import {
  PlusIcon,
  TrashIcon,
  VariableIcon,
  WarningIcon,
  QuestionIcon,
  BoolNoIcon,
  BoolYesIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import Joi from 'joi'
import { FormWrapper } from './form.mjs'
import { slugify } from 'lib/utils.mjs'
import { FormControl } from '../../inputs.mjs'
import SecretSelectDocs from 'mdx/secret-select.mdx'
import VariableSelectDocs from 'mdx/variable-select.mdx'

const TokenHelp = ({ secrets, pushModal }) => (
  <button
    className=""
    onClick={() =>
      pushModal(
        <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
          {secrets ? <SecretSelectDocs /> : <VariableSelectDocs />}
        </ModalWrapper>
      )
    }
  >
    <QuestionIcon className="w-4 h-4 text-warning" />
  </button>
)

export const TokenSelect = (props) => {
  const { pushModal } = useContext(ModalContext)

  const {
    update,
    secrets = true,
    mSettings,
    label = '',
    labelTR = '',
    labelBL = '',
    labelBR = '',
    id,
    current = false,
  } = props

  if (!id) return null
  const allTokens = secrets ? mSettings?.tokens?.secrets || {} : mSettings?.tokens?.vars || {}

  return (
    <FormControl
      {...{ label, labelTR, labelBL, labelBR }}
      forId={id}
      labelTR={<TokenHelp {...{ pushModal, secrets }} />}
    >
      <select
        className={`select w-full select-bordered select-success`}
        onChange={(evt) => update(evt.target.value)}
      >
        <option disabled={current ? false : true} selected>
          Pick a {secrets ? 'secret' : 'variable'}
        </option>
        {Object.keys(allTokens).map((key) => {
          const val = `{{{ ${key} }}}`
          return (
            <option key={key} value={val} selected={current === val}>
              {key}
            </option>
          )
        })}
        <option disabled>
          You can add {secrets ? 'secrets' : 'variables'} via tokens &raquo;{' '}
          {secrets ? 'secrets' : 'variables'}
        </option>
      </select>
    </FormControl>
  )
}

export const TokenInput = ({ token, setToken }) => {
  const [key, setKey] = useState(token?.key || '')
  const [val, setVal] = useState(token?.val === undefined ? '' : token.val)
  const [type, setType] = useState(token?.type || 'string')

  const valAs = (v, type) => {
    if (type === 'bool') return !v || `${v}`.toLowerCase() === 'false' ? false : true
    else if (type === 'number') {
      if (isNaN(Number(v))) return 0
      else return Number(v)
    } else if (type === 'string') return `${v}`
  }

  const localUpdate = (k, v) => {
    const newToken = { ...token }
    if (k === 'type') {
      setType(v)
      const newVal = valAs(val, v)
      setVal(newVal)
      newToken.type = v
      newToken.val = newVal
    } else if (k === 'key') {
      const newKey = slugify(v).toUpperCase().split('-').join('_')
      setKey(newKey)
      newToken.key = newKey
    } else if (k === 'val') {
      const newVal = valAs(v, type)
      setVal(newVal)
      newToken.val = newVal
    }

    setToken(newToken)
  }

  return (
    <FormWrapper
      update={localUpdate}
      form={[
        [
          {
            schema: Joi.string().required().label('Key'),
            current: key,
            placeholder: 'NAME',
            label: 'Name',
            labelBL: `The name of the token`,
            key: 'key',
            valid: () => true,
          },
          {
            label: 'Type',
            labelBL: 'How to store this value',
            labelTR: (
              <div className="flex flex-row gap-2 text-warning">
                <WarningIcon className="w-4 h-4" />
                <span className="italic opacity-70">Value will be cast to this type</span>
              </div>
            ),
            schema: Joi.string().required().valid('string', 'number', 'bool').label('Type'),
            key: 'type',
            current: type,
            inputType: 'buttonList',
            dir: 'row',
            dense: true,
            list: [
              { val: 'string', label: 'String' },
              { val: 'number', label: 'Number' },
              { val: 'bool', label: 'Boolean' },
            ],
          },
        ],
        {
          schema:
            type === 'number'
              ? Joi.number().required().label('Value')
              : Joi.string().required().label('Value'),
          current: val,
          inputType: type === 'bool' ? 'toggle' : type === 'string' ? 'textarea' : 'text',
          placeholder: 'Value goes here',
          label: 'Value',
          abelBL: 'The value of the token',
          key: 'val',
          valid: () => true,
        },
      ]}
    />
  )
}

const AddVariable = ({ update, data, current = {}, edit, secrets, popModal }) => {
  const [token, setToken] = useState(current)

  const create = () => {
    update(`tokens.${secrets ? 'secrets' : 'vars'}.${token.key}`, token.val, data)
    popModal()
  }
  const remove = () => {
    update(`tokens.${secrets ? 'secrets' : 'vars'}.${token.key}`, 'MORIO_UNSET', data)
    popModal()
  }

  return (
    <div className="max-w-2xl w-full">
      <h3 className="flex flex-row justify-between items-center w-full">
        {edit ? 'Update' : 'Create'} {secrets ? 'Secret' : 'Variable'}
        <VariableIcon className="w-12 h-12" stroke={2} />
      </h3>
      <TokenInput {...{ token, setToken }} />
      <div className="mt-2 flex flex-row gap-2 items-center justify-center">
        <button
          className="btn btn-primary px-12"
          onClick={create}
          disabled={!token || !token.key || token.key.length < 2}
        >
          {edit ? 'Update' : 'Create'} {secrets ? 'Secret' : 'Variable'}
        </button>
        {edit ? (
          <button className="btn btn-error" onClick={() => remove(token.key || current.key)}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
    </div>
  )
}

const ShowVariable = ({ pushModal, popModal, token, update, data, secrets }) => (
  <button
    className="btn btn-outline btn-primary btn-sm"
    onClick={() =>
      pushModal(
        <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
          <AddVariable
            {...{ pushModal, popModal, update, data, secrets }}
            edit={true}
            current={token}
          />
        </ModalWrapper>
      )
    }
  >
    {token.key}
  </button>
)

export const Tokens = ({ update, data, secrets = false }) => {
  const { pushModal, popModal } = useContext(ModalContext)

  const allTokens = secrets ? data?.tokens?.secrets || {} : data?.tokens?.vars || {}

  return (
    <>
      <div className="flex flex-row gap-2 flex-wrap mb-4">
        {Object.keys(allTokens)
          .sort()
          .map((key) => {
            return (
              <ShowVariable
                key={key}
                {...{ pushModal, popModal, data, secrets, update }}
                token={{ key, val: allTokens[key] }}
              />
            )
          })}
      </div>
      <button
        className="btn btn-primary"
        onClick={() =>
          pushModal(
            <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
              <AddVariable {...{ popModal, pushModal, data, update, secrets }} edit={false} />
            </ModalWrapper>
          )
        }
      >
        <PlusIcon className="w-6 h-6 mr-4" stroke={3} /> Add {secrets ? 'Secret' : 'Variable'}
      </button>
    </>
  )
}

export const Vars = Tokens
export const Secrets = (props) => <Tokens {...props} secrets />

const flags = {
  DISABLE_ROOT_TOKEN: 'Block authentication with the Morio Root Token',
  HEADLESS_MORIO: 'Run Morio in headless mode, where the UI is not available',
}

export const Flags = ({ update, data }) => {
  const { pushModal, popModal } = useContext(ModalContext)

  const allFlags = data?.tokens?.flags || {}

  return (
    <>
      <div className="flex flex-col gap-2">
        {Object.keys(data?.tokens?.flags || {})
          .sort()
          .map((key) => (
            <label
              className={`hover:cursor-pointer border-4 border-y-0 border-r-0 p-2
              hover:border-primary hover:bg-primary hover:bg-opacity-10`}
              key={key}
              for={key}
            >
              <div for={key} className="flex flex-row gap-2 items-center">
                {data.tokens.flags[key] ? <BoolYesIcon /> : <BoolNoIcon />}
                <span
                  className={`badge badge-lg badge-${data.tokens.flags[key] ? 'success' : 'error'}`}
                >
                  {key}
                </span>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <input
                  id={key}
                  type="checkbox"
                  value={data.tokens.flags[key]}
                  onChange={() => update(`tokens.flags.${key}`, !data.tokens.flags[key])}
                  className="toggle my-3 toggle-primary"
                  checked={data.tokens.flags[key]}
                />
                <label className="hover:cursor-pointer" for={key}>
                  {flags[key]}
                </label>
              </div>
            </label>
          ))}
      </div>
    </>
  )
}
