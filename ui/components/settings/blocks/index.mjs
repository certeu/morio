// Components
import React, { Fragment } from 'react'
import { Popout } from 'components/popout.mjs'
import { Markdown } from 'components/markdown.mjs'
// Blocks (which are also components)
import { AuthProviders } from './iam.mjs'
import { ConnectorInputs, ConnectorOutputs, ConnectorPipelines } from './connector.mjs'
import { Flags, Vars, Secrets } from './tokens.mjs'
import { FormWrapper } from './form.mjs'
import { MdxWrapper } from './mdx.mjs'

/*
 * Map between type in wizard config and React component
 */
const blocks = {
  authProviders: AuthProviders,
  connectorInputs: ConnectorInputs,
  connectorOutputs: ConnectorOutputs,
  connectorPipelines: ConnectorPipelines,
  flags: Flags,
  vars: Vars,
  secrets: Secrets,
  form: FormWrapper,
  mdx: ({ viewConfig }) => <MdxWrapper>{viewConfig.mdx}</MdxWrapper>,
}

const LockedOnEdit = () => (
  <Popout note>
    <h5>These settings are locked</h5>
    <p>Once deployed, these settings cannot be changed.</p>
  </Popout>
)

/*
 * A wrapper component for all settings blocks
 *
 * This will return a specific block based on the type and pass down props
 *
 * @param {object} props - Props to pass down
 * @return {function} Component - React component
 */
export const Block = (props) => {
  const viewConfig = props.viewConfig || props.template?.children?.[props.section]
  if (viewConfig && typeof blocks[viewConfig.type] === 'function') {
    const Component = viewConfig.locked ? viewConfig.locked : blocks[viewConfig.type]
    const disabled = props.edit && props.template.lockOnEdit

    return viewConfig.locked ? (
      <Popout note>
        <h3>These settings are locked</h3>
        <p>This indicated that a prerequisite is not fulfilled.</p>
        <Component {...props} viewConfig={viewConfig} disabled={disabled} />
      </Popout>
    ) : (
      <>
        {props.edit && props.template.lockOnEdit ? <LockedOnEdit /> : null}
        <Component {...props} {...viewConfig} viewConfig={viewConfig} disabled={disabled} />
      </>
    )
  } else {
    if (props.template.title && props.template.children)
      return (
        <div className="max-w-prose mdx">
          {props.edit && props.template.lockOnEdit ? <LockedOnEdit /> : null}
          {React.isValidElement(props.template.about) ? (
            <Fragment>{props.template.about}</Fragment>
          ) : (
            <Markdown>{props.template.about}</Markdown>
          )}
        </div>
      )
  }

  return (
    <Popout warning>
      <p>
        fixme: Invalid block type (<code>{viewConfig?.type}</code>)
      </p>
    </Popout>
  )
}
