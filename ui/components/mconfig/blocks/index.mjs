// Components
import { Popout } from 'components/popout.mjs'
import { Markdown } from 'components/markdown.mjs'
// Blocks (which are also components)
import { InfoBlock, ListBlock, StringBlock, StringsBlock } from './base.mjs'
import { LogstashInputs, LogstashOutputs, LogstashPipelines } from './logstash.mjs'
import { ConfigNavigation } from '../config-wizard.mjs'

/*
 * Map between type in wizard config and React component
 */
const blocks = {
  info: InfoBlock,
  list: ListBlock,
  string: StringBlock,
  strings: StringsBlock,
  logstashInputs: LogstashInputs,
  logstashOutputs: LogstashOutputs,
  logstashPipelines: LogstashPipelines,
}

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

    return viewConfig.locked ? (
      <Popout fixme>
        <h3>This configuration block is locked</h3>
        <Component {...props} viewConfig={viewConfig} />
      </Popout>
    ) : (
      <Component {...props} viewConfig={viewConfig} />
    )
  } else {
    if (props.template.title && props.template.children)
      return (
        <div className="max-w-prose">
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
