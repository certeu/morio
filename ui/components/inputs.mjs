// Hooks
import { useCallback } from 'react'
// Components
import { Markdown } from 'components/markdown.mjs'
import { useDropzone } from 'react-dropzone'
import { OkIcon, ResetIcon } from 'components/icons.mjs'

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
}) => {
  const topLabelChildren = (
    <>
      {label ? <span className="label-text-alt font-bold -mb-1">{label}</span> : <span></span>}
      {labelTR ? <span className="label-text-alt -mb-1">{labelTR}</span> : null}
    </>
  )
  const bottomLabelChildren = (
    <>
      {labelBL ? <span className="label-text-alt">{labelBL}</span> : <span></span>}
      {labelBR ? <span className="label-text-alt">{labelBR}</span> : null}
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
}) => (
  <button
    className={`
    btn btn-ghost btn-secondary relative
    w-full ${dense ? 'mt-1 py-0 btn-sm' : 'mt-2 py-4 h-auto content-start'}
    border-2 border-secondary text-left bg-opacity-20
    ${accordion ? 'hover:bg-transparent' : 'hover:bg-secondary hover:bg-opacity-10'}
    hover:border-secondary hover:border-solid hover:border-2
    ${active ? 'border-solid' : 'border-dotted'}
    ${active && !accordion ? 'bg-secondary' : 'bg-transparent'}
    `}
    onClick={onClick}
  >
    {children}
    {active ? <OkIcon className="text-success w-8 h-8 absolute top-2 right-2" stroke={4} /> : null}
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
 * Input for integers
 */
export const NumberInput = ({
  label, // Label to use
  update, // onChange handler
  valid, // Method that should return whether the value is valid or not
  current, // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-Right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
  max = 0,
  min = 220,
  step = 1,
}) => (
  <FormControl {...{ label, labelBL, labelBR, labelTR }} forId={id}>
    <input
      id={id}
      type="number"
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`input w-full input-bordered ${
        current === original ? 'input-secondary' : valid(current) ? 'input-success' : 'input-error'
      }`}
      {...{ max, min, step }}
    />
  </FormControl>
)

/*
 * Input for strings
 */
export const StringInput = ({
  label, // Label to use
  update, // onChange handler
  valid, // Method that should return whether the value is valid or not
  current='', // The current value
  original, // The original value
  placeholder, // The placeholder text
  id = '', // An id to tie the input to the label
  labelTR = false, // Top-right label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
}) => (
  <FormControl {...{ label, labelTR, labelBL, labelBR }} forId={id}>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={current}
      onChange={(evt) => update(evt.target.value)}
      className={`input w-full input-bordered ${
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
  label, // The label
  list, // The list of items to present { val, label, about }
  current, // The (value of the) current item
}) => (
  <FormControl label={label}>
    {list.map((item, i) => {
      const entry =
        typeof item.val === 'object' && item.val.type === 'select' ? (
          <FakeButtonFrame key={i} active={item.val.values.includes(current)}>
            <div className="w-full flex flex-col gap-2">
              <div className="w-full text-lg leading-5">{item.label}</div>
              {item.about ? (
                <div className="w-full text-normal font-normal normal-case pt-1 leading-5">
                  <Markdown>{item.about}</Markdown>
                </div>
              ) : null}
              <div className="flex flex-row gap-1 flex-wrap items-center justify-around">
                {item.val.labels.map((lbl, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${
                      current === item.val.values[i] ? 'btn-primary' : 'btn-secondary'
                    }`}
                    onClick={() => update(item.val.values[i])}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </FakeButtonFrame>
        ) : (
          <ButtonFrame key={i} active={item.val === current} onClick={() => update(item.val)}>
            <div className="w-full flex flex-col gap-2">
              <div className="w-full text-lg leading-5">{item.label}</div>
              {item.about ? (
                <div className="w-full text-normal font-normal normal-case pt-1 leading-5">
                  <Markdown>{item.about}</Markdown>
                </div>
              ) : null}
            </div>
          </ButtonFrame>
        )

      return item.hide ? (
        <details key={i} className="py-2">
          <summary className="pl-4 hover:cursor-pointer text-sm text-primary">{item.hide}</summary>
          {entry}
        </details>
      ) : (
        entry
      )
    })}
  </FormControl>
)

/*
 * Input for a (configuration) file
 */
export const FileInput = ({
  label, // The label
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
      <FormControl label={label}>
        <div className="bg-base-100 w-full h-36 mb-2 mx-auto flex flex-col items-center text-center justify-center">
          <button
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
    <FormControl label={label} forId={id}>
      <div
        {...getRootProps()}
        className={`
        flex rounded-lg w-full flex-col items-center justify-center
        sm:p-6 sm:border-4 sm:border-secondary sm:border-dashed
      `}
      >
        <input {...getInputProps()} />
        <p className="hidden lg:block p-0 m-0">Drag and drop your file here</p>
        <button className={`btn btn-secondary btn-outline mt-4 px-8`}>Browse...</button>
      </div>
    </FormControl>
  )
}
