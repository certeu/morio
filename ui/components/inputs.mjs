import { roles } from 'config/roles.mjs'
// Hooks
import { useCallback, useState } from 'react'
// Components
import { Markdown } from 'components/markdown.mjs'
import { useDropzone } from 'react-dropzone'
import { OkIcon, ResetIcon, WarningIcon } from 'components/icons.mjs'

/*
 * Helper component to wrap a form control with a label
 */
export const FormControl = ({
  label, // the (top-left) label
  children, // Children to go inside the form control
  labelTR = false, // Optional top-right label
  labelBL = false, // Optional bottom-left label
  labelBR = false, // Optional bottom-right label
  forId = false, // ID of the for element we are wrapping
  isValid = false, // Result of validation
}) => {
  const topLabelChildren = (
    <>
      {label ? <span className="label-text-alt font-bold -mb-1">{label}</span> : <span></span>}
      {labelTR ? <span className="label-text-alt -mb-1">{labelTR}</span> : null}
    </>
  )
  const bottomLabelChildren = (
    <>
      {labelBL ? <span className="label-text-alt -mt-1">{labelBL}</span> : <span></span>}
      {labelBR ? <span className="label-text-alt -mt-1">{labelBR}</span> : null}
    </>
  )

  return (
    <div className="form-control w-full mt-2">
      {label || labelTR ? (
        forId ? (
          <label className="label" htmlFor={forId}>
            {topLabelChildren}
          </label>
        ) : (
          <div className="label">{topLabelChildren}</div>
        )
      ) : null}
      {children}
      {labelBL || labelBR ? (
        forId ? (
          <label className="label" htmlFor={forId}>
            {bottomLabelChildren}
          </label>
        ) : (
          <div className="label">{bottomLabelChildren}</div>
        )
      ) : null}
      <ValidationErrors valid={isValid} bLabel={labelBL || labelBR} />
    </div>
  )
}

/*
 * Helper method to wrap content in a button
 */
export const ButtonFrame = ({
  children, // Children of the button
  onClick, // onClick handler
  active, // Whether or not to render the button as active/selected
  accordion = false, // Set this to true to not set a background color when active
  dense = false, // Use less padding
  disabled = false, // Allows rendering a disabled view
  dir = 'col',
}) => (
  <button
    type="button"
    disabled={disabled}
    className={`
    btn btn-ghost btn-secondary relative grow
    ${dir === 'col' ? 'w-full' : 'mr-2 mb-2'}
    ${dense ? 'mt-0 py-2 btn' : 'mt-2 py-4 h-auto content-start'}
    border-2 border-secondary text-left bg-opacity-20
    ${accordion ? 'hover:bg-transparent' : 'hover:bg-secondary hover:bg-opacity-10'}
    hover:border-secondary hover:border-solid hover:border-2
    ${active ? 'border-solid' : 'border-dotted'}
    ${active && !accordion ? 'bg-secondary' : 'bg-transparent'}
    `}
    onClick={onClick}
  >
    {children}
    {active ? (
      <OkIcon
        className={`text-success w-8 h-8 absolute ${dense ? '-top-3 -right-3' : 'top-2 right-2'}`}
        stroke={4}
      />
    ) : null}
  </button>
)

/*
 * Helper method to wrap content in a fake button
 */
export const FakeButtonFrame = ({
  children, // Children of the button
  active, // Whether or not to render the button as active/selected
  accordion = false, // Set this to true to not set a background color when active
  dense = false, // Use less padding
}) => (
  <div
    className={`
    btn btn-ghost btn-secondary relative
    w-full ${dense ? 'mt-1 py-0 btn-sm' : 'mt-2 py-4 h-auto content-start'}
    border-2 border-secondary text-left bg-opacity-20
    ${accordion ? 'hover:bg-transparent' : 'hover:bg-secondary hover:bg-opacity-10'}
    hover:border-secondary hover:border-solid hover:border-2
    ${active ? 'border-solid' : 'border-dotted'}
    ${active && !accordion ? 'bg-secondary' : 'bg-transparent'}
    `}
  >
    {children}
    {active ? <OkIcon className="text-success w-8 h-8 absolute top-2 right-2" stroke={4} /> : null}
  </div>
)

/*
 * Input for booleans
 */
export const ToggleInput = ({
  label, // Label to use
  update, // onChange handler
  current, // The current value
  disabled = false, // Allows rendering a disabled view
  list = [true, false], // The values to chose between
  labels = ['Yes', 'No'], // The labels for the values
  on = true, // The value that should show the toggle in the 'on' state
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-Right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
}) => (
  <FormControl
    {...{ labelBL, labelBR, labelTR }}
    label={`${label} (${current === on ? labels[0] : labels[1]})`}
    forId={id}
  >
    <input
      id={id}
      disabled={disabled}
      type="checkbox"
      value={current}
      onChange={() => update(list.indexOf(current) === 0 ? list[1] : list[0])}
      className="toggle my-3 toggle-primary"
      checked={list.indexOf(current) === 0 ? true : false}
    />
  </FormControl>
)

/*
 * Slider input (variant for numbers)
 */
export const SliderInput = (props) => <NumberInput {...props} inputType="range" />

/*
 * Input for integers
 */
export const NumberInput = ({
  label, // Label to use
  update, // onChange handler
  valid = () => true, // Method that should return whether the value is valid or not
  current, // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-Right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  disabled = false, // Allows rendering a disabled view
  max = 0,
  min = 220,
  step = 1,
  inputType = 'input',
}) => {
  const isValid = valid(current)
  if (inputType === 'range') label += ` (${current})`

  return (
    <FormControl {...{ label, labelBL, labelBR, labelTR, isValid }} forId={id}>
      <input
        id={id}
        disabled={disabled}
        type={inputType === 'range' ? 'range' : 'number'}
        placeholder={placeholder}
        value={current}
        onChange={(evt) => update(evt.target.value)}
        className={`w-full bg-base-100 ${
          inputType === 'range' ? 'range range-primary range-sm' : 'input input-bordered'
        } ${
          isValid?.error
            ? 'input-error'
            : current === original
              ? 'input-secondary'
              : 'input-success'
        }`}
        {...{ max, min, step }}
      />
    </FormControl>
  )
}

/*
 * Input for strings
 */
export const StringInput = ({
  label, // Label to use
  update, // onChange handler
  valid = () => true, // Method that should return whether the value is valid or not
  current = '', // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  disabled = false, // Allows rendering a disabled view
}) => {
  const isValid = valid(current)

  return (
    <FormControl {...{ label, labelTR, labelBL, labelBR, isValid }} forId={id}>
      <input
        id={id}
        disabled={disabled}
        type="text"
        placeholder={placeholder}
        value={current}
        onChange={(evt) => update(evt.target.value)}
        className={`input w-full bg-base-100 input-bordered ${
          isValid?.error
            ? 'input-error'
            : current === original
              ? 'input-secondary'
              : 'input-success'
        }`}
      />
    </FormControl>
  )
}

/*
 * Input for secrets
 */
export const SecretInput = ({
  label, // Label to use
  update, // onChange handler
  valid = () => true, // Method that should return whether the value is valid or not
  current = '', // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  disabled = false, // Allows rendering a disabled view
}) => {
  const isValid = valid(current)
  const [reveal, setReveal] = useState(false)
  const labelTR = (
    <button
      type="button"
      onClick={() => setReveal(!reveal)}
      className={`px-2 rounded ${
        reveal ? 'bg-success text-success-content' : 'bg-warning text-warning-content'
      }`}
    >
      {reveal ? 'Hide' : 'Reveal'}
    </button>
  )

  return (
    <FormControl {...{ label, labelTR, labelBL, labelBR, isValid }} forId={id}>
      <input
        id={id}
        disabled={disabled}
        type={reveal ? 'text' : 'password'}
        placeholder={placeholder}
        value={current}
        onChange={(evt) => update(evt.target.value)}
        className={`input w-full bg-base-100 input-bordered ${
          isValid?.error
            ? 'input-error'
            : current === original
              ? 'input-secondary'
              : 'input-success'
        }`}
      />
    </FormControl>
  )
}

/*
 * Input for hidden values
 */
export const HiddenInput = ({
  current = '', // The current value
  id = '', // An id to tie the input to the label
}) => <input id={id} type="hidden" value={current} />

/*
 * Input for text (longer than strings, textarea)
 */
export const TextInput = ({
  label, // Label to use
  update, // onChange handler
  valid = () => true, // Method that should return whether the value is valid or not
  current = '', // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  disabled = false, // Allows rendering a disabled view
}) => (
  <FormControl {...{ label, labelTR, labelBL, labelBR }} forId={id} isValid={valid(current)}>
    <textarea
      id={id}
      disabled={disabled}
      type="text"
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`input w-full bg-base-100 input-bordered h-36 py-2 ${
        current === original ? 'input-secondary' : valid(current) ? 'input-success' : 'input-error'
      }`}
    />
  </FormControl>
)

/*
 * Input for a list of things to pick from
 */
export const ListInput = ({
  update, // the onChange handler
  valid = () => true, // Method that should return whether the value is valid or not
  label, // The label
  labelTR = false, // Top-right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  list, // The list of items to present { val, label, about }
  current, // The (value of the) current item
  disabled = false, // Allows rendering a disabled view
  dir = 'col', // Allows to change the direction
  dense = false,
}) => (
  <FormControl {...{ label, labelTR, labelBL, labelBR }} isValid={valid(current)}>
    <div className={`flex flex-${dir} flex-wrap`}>
      {list.map((item, i) => {
        const entry =
          typeof item.val === 'object' && item.val.type === 'select' ? (
            <FakeButtonFrame
              dense={dense}
              key={i}
              active={item.val.values.includes(current)}
              disabled={item.disabled}
            >
              <div className="w-full text-lg leading-5">{item.label}</div>
              {item.about ? (
                <div className="w-full text-normal font-normal normal-case pt-1 leading-5">
                  <Markdown>{item.about}</Markdown>
                </div>
              ) : null}
              <div className="flex flex-row gap-1 flex-wrap items-center justify-around">
                {item.val.labels.map((lbl, i) => (
                  <button
                    type="button"
                    key={i}
                    disabled={disabled}
                    className={`btn btn-sm ${
                      current === item.val.values[i] ? 'btn-primary' : 'btn-primary btn-outline'
                    }`}
                    onClick={() => update(item.val.values[i])}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </FakeButtonFrame>
          ) : (
            <ButtonFrame
              key={i}
              dense={dense}
              active={item.val === current}
              onClick={() => update(item.val)}
              dir={dir}
              disabled={item.disabled}
            >
              <div className={`w-full ${dir === 'col' ? 'text-lg leading-5' : 'text-sm'}`}>
                {item.label}
              </div>
              {item.about ? (
                <div className="w-full text-normal font-normal normal-case pt-1 leading-5">
                  <Markdown>{item.about}</Markdown>
                </div>
              ) : null}
            </ButtonFrame>
          )

        return item.hide ? (
          <details key={i} className="py-2">
            <summary className="pl-4 hover:cursor-pointer text-sm text-primary">
              {item.hide}
            </summary>
            {entry}
          </details>
        ) : (
          entry
        )
      })}
    </div>
  </FormControl>
)

/*
 * Input for a (configuration) file
 */
export const FileInput = ({
  label, // The label
  valid = () => true, // Method that should return whether the value is valid or not
  update, // The onChange handler
  current, // The current value
  original, // The original value
  id = '', // An id to tie the input to the label
  dropzoneConfig = {}, // Configuration for react-dropzone
}) => {
  /*
   * Ondrop handler
   */
  const onDrop = useCallback(
    (acceptedFiles) => {
      const reader = new FileReader()
      reader.onload = async () => update(reader.result)
      acceptedFiles.forEach((file) => reader.readAsDataURL(file))
    },
    [update]
  )

  /*
   * Dropzone hook
   */
  const { getRootProps, getInputProps } = useDropzone({ onDrop, ...dropzoneConfig })

  /*
   * If we have a current file, return this
   */
  if (current)
    return (
      <FormControl label={label} isValid={valid(current)}>
        <div className="bg-base-100 w-full h-36 mb-2 mx-auto flex flex-col items-center text-center justify-center">
          <button
            type="button"
            className="btn btn-neutral btn-circle opacity-50 hover:opacity-100"
            onClick={() => update(original)}
          >
            <ResetIcon />
          </button>
        </div>
      </FormControl>
    )

  /*
   * Return upload form
   */
  return (
    <FormControl label={label} forId={id} isValid={valid(current)}>
      <div
        {...getRootProps()}
        className={`
        flex rounded-lg w-full flex-col items-center justify-center
        sm:p-6 sm:border-4 sm:border-secondary sm:border-dashed
      `}
      >
        <input {...getInputProps()} />
        <p className="hidden lg:block p-0 m-0">Drag and drop your file here</p>
        <button type="button" className={`btn btn-secondary btn-outline mt-4 px-8`}>
          Browse...
        </button>
      </div>
    </FormControl>
  )
}

export const ValidationErrors = ({ valid, bLabel }) => (
  <ul className={`list-inside text-sm text-error ml-2 ${bLabel ? '-mt-1' : 'mt-1'}`}>
    {
      valid?.error?.details ? (
        valid.error.details.map((err, i) => (
          <li key={i} className="flex flex-row gap-2 items-center text-xs">
            <WarningIcon className="h-4 w-4" />
            {err.message.replace('must not be a sparse array item', 'cannot contain empty values')}
          </li>
        ))
      ) : (
        <li>&nbsp;</li>
      ) /* Always include this to prevent layout-shift */
    }
  </ul>
)

export const RoleInput = ({
  role,
  setRole,
  maxRole = false,
  label = 'Role',
  labelBL,
  labelBR,
  labelTR,
  hide = ['root'],
}) => (
  <ListInput
    label={label}
    {...{ labelBL, labelBR, labelTR }}
    dense
    dir="row"
    update={(val) => (role === val ? setRole(false) : setRole(val))}
    current={role}
    list={roles
      .filter((role) => !hide.includes(role))
      .map((role, i) => ({
        val: role,
        label: <span className="text-center block">{role}</span>,
        disabled: maxRole ? i > roles.indexOf(maxRole) : false,
      }))}
    dflt="user"
  />
)
