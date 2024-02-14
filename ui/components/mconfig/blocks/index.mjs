// Components
import { Popout } from 'components/popout.mjs'
import { Markdown } from 'components/markdown.mjs'
// Blocks (which are also components)
import { InfoBlock, ListBlock, StringBlock, StringsBlock } from './base.mjs'
import { ConnectorInputs, ConnectorOutputs, ConnectorPipelines } from './connector.mjs'
import { ConfigNavigation } from '../config-wizard.mjs'
import { FormWrapper } from './form.mjs'

/*
 * Map between type in wizard config and React component
 */
const blocks = {
  info: InfoBlock,
  form: FormWrapper,
  list: ListBlock,
  string: StringBlock,
  strings: StringsBlock,
  connectorInputs: ConnectorInputs,
  connectorOutputs: ConnectorOutputs,
  connectorPipelines: ConnectorPipelines,
}

const LockedOnEdit = () => (
  <Popout warning>
    <h5>This configuration block is locked for editing</h5>
    <p>
      This typically indicates that the configuration is part of the initial Morio setup, and cannot
      be changed on an active Morio deployment.
    </p>
  </Popout>
)

/*
 * A wrapper component for all configuration blocks
 *
 * This will return a specific block based on the type and pass down props
 *
 * @param {object} props - Props to pass down
 * @return {function} Component - React component
 */
export const Block = (props) => {
  const viewConfig = props.template?.children?.[props.section]
  if (viewConfig && typeof blocks[viewConfig.type] === 'function') {
    const Component = viewConfig.locked ? viewConfig.locked : blocks[viewConfig.type]
    const disabled = props.edit && props.template.lockOnEdit

    return viewConfig.locked ? (
      <Popout warning>
        <h3>This configuration block is locked</h3>
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
        <div className="max-w-prose">
          {props.edit && props.template.lockOnEdit ? (
            <Popout warning>
              <h5>This configuration block is locked for editing</h5>
              <p>
                This typically indicates that the configuration is part of the initial Morio setup,
                and cannot be changed on a Morio deployment.
              </p>
            </Popout>
          ) : null}
          <Markdown>{props.template.about}</Markdown>
          <ConfigNavigation
            view={props.configPath}
            loadView={props.loadView}
            nav={props.template.children}
            mConf={props.mConf}
            lead={[props.section]}
          />
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
