// Hooks
import { useState, useCallback } from 'react'
// Components
import { Tabs, Tab } from 'components/tabs.mjs'

/*
 * Helper component to display a tab heading
 */
export const _Tab = ({
  id, // The tab ID
  label, // A label for the tab, if not set we'll use the ID
  activeTab, // Which tab (id) is active
  setActiveTab, // Method to set the active tab
}) => (
  <button
    className={`text-lg font-bold capitalize tab tab-bordered grow
    ${activeTab === id ? 'tab-active' : ''}`}
    onClick={() => setActiveTab(id)}
  >
    {label ? label : id}
  </button>
)

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
    btn btn-ghost btn-secondary
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
    btn btn-ghost btn-secondary
    w-full ${dense ? 'mt-1 py-0 btn-sm' : 'mt-2 py-4 h-auto content-start'}
    border-2 border-secondary text-left bg-opacity-20
    ${accordion ? 'hover:bg-transparent' : 'hover:bg-secondary hover:bg-opacity-10'}
    hover:border-secondary hover:border-solid hover:border-2
    ${active ? 'border-solid' : 'border-dotted'}
    ${active && !accordion ? 'bg-secondary' : 'bg-transparent'}
    `}
  >
    {children}
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
  <FormControl {...{ label, labelBL, labelBR, docs }} forId={id}>
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
  current, // The current value
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
 * Input for MFA code
 */
export const MfaInput = ({
  update, // onChange handler
  current, // The current value
  id = 'mfa', // An id to tie the input to the label
}) => {
  const { t } = useTranslation(['susi'])

  return (
    <StringInput
      label={t('susi:mfaCode')}
      valid={(val) => val.length > 4}
      {...{ update, current, id }}
      placeholder={t('susi:mfaCode')}
      docs={false}
    />
  )
}

/*
 * Input for passwords
 */
export const PasswordInput = ({
  label, // Label to use
  update, // onChange handler
  valid, // Method that should return whether the value is valid or not
  current, // The current value
  placeholder = '¯\\_(ツ)_/¯', // The placeholder text
  docs = false, // Docs to load, if any
  id = '', // An id to tie the input to the label
  onKeyDown = false, // Optionall capture certain keys (like enter)
}) => {
  const { t } = useTranslation(['account'])
  const [reveal, setReveal] = useState(false)

  const extraProps = onKeyDown ? { onKeyDown } : {}

  return (
    <FormControl
      label={label}
      docs={docs}
      forId={id}
      labelBR={
        <button
          className="btn btn-primary btn-ghost btn-xs -mt-2"
          onClick={() => setReveal(!reveal)}
        >
          {reveal ? t('hidePassword') : t('revealPassword')}
        </button>
      }
    >
      <input
        id={id}
        type={reveal ? 'text' : 'password'}
        placeholder={placeholder}
        value={current}
        onChange={(evt) => update(evt.target.value)}
        className={`input w-full input-bordered ${
          valid(current) ? 'input-success' : 'input-error'
        }`}
        {...extraProps}
      />
    </FormControl>
  )
}

/*
 * Input for email addresses
 */
export const EmailInput = ({
  label, // Label to use
  update, // onChange handler
  valid, // Method that should return whether the value is valid or not
  current, // The current value
  original, // The original value
  placeholder, // The placeholder text
  docs = false, // Docs to load, if any
  id = '', // An id to tie the input to the label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
}) => (
  <FormControl {...{ label, docs, labelBL, labelBR }} forId={id}>
    <input
      id={id}
      type="email"
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
  docs = false, // Docs to load, if any
}) => (
  <FormControl label={label} docs={docs}>
    {list.map((item, i) => (typeof item.val === 'object' && item.val.type === 'select')
      ? (
        <FakeButtonFrame key={i} active={item.val.values.includes(current)}>
          <div className="w-full flex flex-col gap-2">
            <div className="w-full text-lg leading-5">{item.label}</div>
            {item.about ? (
              <div className="w-full text-normal font-normal normal-case pt-1 leading-5">
                {item.about}
              </div>
            ) : null}
            <div className="flex flex-row gap-2 flex-wrap items-center justify-start">
            {item.val.labels.map((lbl, i) => (
              <button key={i}
                className={`btn btn-sm ${current === item.val.values[i] ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => update(item.val.values[i])}
              >{lbl}</button>
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
                {item.about}
              </div>
            ) : null}
          </div>
        </ButtonFrame>
      )
    )}
  </FormControl>
)

/*
 * Input for markdown content
 */
export const MarkdownInput = ({
  label, // The label
  current, // The current value (markdown)
  update, // The onChange handler
  placeholder, // The placeholder content
  docs = false, // Docs to load, if any
  id = '', // An id to tie the input to the label
  labelBL = false, // Bottom-Left label
  labelBR = false, // Bottom-Right label
}) => (
  <FormControl {...{ label, labelBL, labelBR, docs }} forId={id}>
    <Tabs tabs={['edit', 'preview']}>
      <Tab key="edit">
        <div className="flex flex-row items-center mt-4">
          <textarea
            id={id}
            rows="5"
            className="textarea textarea-bordered textarea-lg w-full"
            value={current}
            placeholder={placeholder}
            onChange={(evt) => update(evt.target.value)}
          />
        </div>
      </Tab>
      <Tab key="preview">
        <div className="flex flex-row items-center mt-4">
          <Mdx md={current} />
        </div>
      </Tab>
    </Tabs>
  </FormControl>
)
