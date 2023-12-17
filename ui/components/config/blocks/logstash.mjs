import { Markdown } from 'components/markdown.mjs'

const BlockItem = ({ title, about, desc = false }) => (
  <details className="border rounded-lg p-0">
    <summary className="hover:cursor-pointer hover:bg-secondary hover:bg-opacity-20 rounded-lg p-4">
      <b>{title}</b> <span className=" text-sm pl-2">{about}</span>
    </summary>
    <div className="p-4">
      {desc ? (
        <Markdown>{desc}</Markdown>
      ) : (
        'This connector requires no configuration, and is always available for use in pipelines.'
      )}
    </div>
  </details>
)

export const LogstashInputs = ({ config, viewConfig, update }) => {
  return (
    <>
      <h3>{viewConfig.title ? viewConfig.title : viewConfig.label}</h3>
      <Markdown>{viewConfig.about}</Markdown>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {Object.keys(viewConfig.blocks).map((id) => (
          <BlockItem id={id} key={id} {...viewConfig.blocks[id]} />
        ))}
      </div>
    </>
  )
}

export const LogstashInput = ({}) => {
  return <p>Logstash input here</p>
}

export const LogstashOutputs = ({ config, viewConfig, update }) => {
  return (
    <>
      <h3>{viewConfig.title ? viewConfig.title : viewConfig.label}</h3>
      <Markdown>{viewConfig.about}</Markdown>
      <div className="grid grid-cols-1 gap-2">
        {Object.keys(viewConfig.blocks).map((id) => (
          <BlockItem id={id} key={id} {...viewConfig.blocks[id]} />
        ))}
      </div>
    </>
  )
}

export const LogstashOutput = ({}) => {
  return <p>Logstash output here</p>
}

export const LogstashPipelines = ({}) => {
  return <p>Logstash pipelines here</p>
}

export const LogstashPipeline = ({}) => {
  return <p>Logstash pipeline here</p>
}

export const LogstashInputAzureEventHubs = ({}) => {
  return <p>Logstash Azure EventHubs input here</p>
}

export const LogstashInputAwsCloudwatch = ({}) => {
  return <p>Logstash Azure EventHubs input here</p>
}

export const LogstashInputGenerator = ({}) => {
  return <p>Logstash Generator input here</p>
}

export const LogstashInputLocalMorio = ({}) => {
  return <p>Logstash Local Morio input here</p>
}

export const LogstashInputRemoteMorio = ({}) => {
  return <p>Logstash Local Morio input here</p>
}
