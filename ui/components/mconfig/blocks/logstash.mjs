import get from 'lodash.get'
import { Markdown } from 'components/markdown.mjs'
import { AmazonCloudWatch, Azure, Elasticsearch, Kafka } from 'components/brands.mjs'
import {
  CodeIcon,
  EmailIcon,
  HttpIcon,
  MorioIcon,
  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'

const brandProps = { fill: 1, stroke: 0, className: 'w-8 h-8' }
const iconProps = { fill: 0, stroke: 1.5, className: 'w-8 h-8' }

const brands = {
  amazon_cloudwatch: <AmazonCloudWatch {...brandProps} />,
  azure_event_hubs: <Azure {...brandProps} />,
  elasticsearch: <Elasticsearch {...brandProps} />,
  http: <HttpIcon {...brandProps} />,
  http_poller: <HttpIcon {...brandProps} />,
  include: <CodeIcon {...iconProps} />,
  imap: <EmailIcon {...iconProps} />,
  generator: <SparklesIcon {...iconProps} />,
  kafka: <Kafka {...brandProps} />,
  morio: <MorioIcon {...brandProps} />,
  morio_remote: <MorioIcon {...brandProps} />,
  sink: <TrashIcon {...iconProps} />,
}

const BlockItem = ({ title, about, id, desc = false }) => (
  <details className="border rounded-lg p-0 shadow">
    <summary className="flex flex-row items-center justify-between gap-2 hover:cursor-pointer hover:bg-secondary hover:bg-opacity-20 rounded-lg px-4 py-2">
      <b>{title}</b>
      {brands[id] ? brands[id] : <span>No icon for {id}</span>}
    </summary>
    <div className="p-4">
      <h5 className="border-b mb-2 -mt-4">{about}</h5>
      {desc ? <Markdown>{desc}</Markdown> : 'This pipeline connector requires no configuration.'}
    </div>
  </details>
)

export const LogstashInputs = ({ config, viewConfig }) => {
  const current = get(config, viewConfig.id, false)
  return (
    <>
      <h3>{viewConfig.title ? viewConfig.title : viewConfig.label}</h3>
      <Markdown>{viewConfig.about}</Markdown>
      <h4>Available pipeline sources</h4>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {Object.keys(viewConfig.blocks)
          .filter((id) => typeof viewConfig.blocks[id].desc === 'undefined')
          .map((id) => (
            <BlockItem key={id} id={id} {...viewConfig.blocks[id]} />
          ))}
      </div>
      {current ? <p>Show current sources</p> : null}
      <h4 className="mt-4">Add a pipeline source</h4>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {Object.keys(viewConfig.blocks)
          .filter((id) => typeof viewConfig.blocks[id].desc !== 'undefined')
          .map((id) => (
            <BlockItem key={id} id={id} {...viewConfig.blocks[id]} />
          ))}
      </div>
    </>
  )
}

export const LogstashInput = () => {
  return <p>Logstash input here</p>
}

export const LogstashOutputs = ({ config, viewConfig }) => {
  const current = get(config, viewConfig.id, false)
  return (
    <>
      <h3>{viewConfig.title ? viewConfig.title : viewConfig.label}</h3>
      <Markdown>{viewConfig.about}</Markdown>
      <h4>Available pipeline destinations</h4>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {Object.keys(viewConfig.blocks)
          .filter((id) => typeof viewConfig.blocks[id].desc === 'undefined')
          .map((id) => (
            <BlockItem key={id} id={id} {...viewConfig.blocks[id]} />
          ))}
      </div>
      {current ? <p>Show current sources</p> : null}
      <h4 className="mt-4">Add a pipeline destination</h4>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {Object.keys(viewConfig.blocks)
          .filter((id) => typeof viewConfig.blocks[id].desc !== 'undefined')
          .map((id) => (
            <BlockItem key={id} id={id} {...viewConfig.blocks[id]} />
          ))}
      </div>
    </>
  )
}

export const LogstashOutput = () => {
  return <p>Logstash output here</p>
}

export const LogstashPipelines = () => {
  return <p>Logstash pipelines here</p>
}

export const LogstashPipeline = () => {
  return <p>Logstash pipeline here</p>
}

export const LogstashInputAzureEventHubs = () => {
  return <p>Logstash Azure EventHubs input here</p>
}

export const LogstashInputAwsCloudwatch = () => {
  return <p>Logstash Azure EventHubs input here</p>
}

export const LogstashInputGenerator = () => {
  return <p>Logstash Generator input here</p>
}

export const LogstashInputLocalMorio = () => {
  return <p>Logstash Local Morio input here</p>
}

export const LogstashInputRemoteMorio = () => {
  return <p>Logstash Local Morio input here</p>
}
