// Components
import { Popout } from 'components/popout.mjs'
// Blocks (which are also components)
import { InfoBlock, ListBlock, StringBlock, StringsBlock } from './base.mjs'
import { LogstashInputs, LogstashOutputs, LogstashPipelines } from './logstash.mjs'

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
  if (typeof blocks[props.viewConfig?.type] === 'function') {
    const Component = blocks[props.viewConfig.type]

    return <Component {...props} />
  }

  return (
    <Popout warning>
      <p>
        fixme: Invalid block type (<code>{props.viewConfig?.type}</code>)
      </p>
    </Popout>
  )
}
