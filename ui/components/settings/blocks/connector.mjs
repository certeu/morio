import get from 'lodash.get'
import { useState, useContext } from 'react'
import { Markdown } from 'components/markdown.mjs'
import { AmazonCloudWatch, Azure, Elasticsearch, Kafka } from 'components/brands.mjs'
// Templates
import { connector as connectorTemplates } from '../templates/connector/index.mjs'
import {
  CodeIcon,
  ConnectorIcon,
  EmailIcon,
  HttpIcon,
  InputIcon,
  LeftIcon,
  MorioIcon,
  OutputIcon,
  RightIcon,
  RssIcon,
  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import Joi from 'joi'
import { FormBlock } from 'components/settings/blocks/form.mjs'
import set from 'lodash.set'
import { FormWrapper } from './form.mjs'

const brandProps = { fill: 1, stroke: 0, className: 'w-8 h-8' }
const iconProps = { fill: 0, stroke: 1.5, className: 'w-8 h-8' }

const brands = {
  amazon_cloudwatch: <AmazonCloudWatch {...brandProps} />,
  azure_event_hubs: <Azure {...brandProps} />,
  custom: <CodeIcon {...iconProps} />,
  elasticsearch: <Elasticsearch {...brandProps} />,
  http: <HttpIcon {...brandProps} />,
  http_poller: <HttpIcon {...brandProps} />,
  imap: <EmailIcon {...iconProps} />,
  generator: <SparklesIcon {...iconProps} />,
  kafka: <Kafka {...brandProps} />,
  morio: <MorioIcon {...brandProps} />,
  morio_remote: <MorioIcon {...brandProps} />,
  morio_local: <MorioIcon {...brandProps} />,
  rss: <RssIcon {...iconProps} stroke={2} />,
  sink: <TrashIcon {...iconProps} />,
}

const XputHeader = ({ id, title, type }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    {brands[id] ? brands[id] : <InputIcon {...iconProps} />}
    <span>
      <b>{title ? title : type}</b> {type}
    </span>
    {type === 'input' ? (
      <InputIcon className="w-12 h-12" stroke={1.25} />
    ) : (
      <OutputIcon className="w-12 h-12" stroke={1.25} />
    )}
  </h3>
)

const AddXput = (props) => (
  <div className="max-w-2xl w-full">
    <XputHeader id={props.id} title={props.title} type={props.type} />
    {props.form ? (
      <FormWrapper {...props} settings={{ plugin: props.id, type: props.type }} action="create" />
    ) : (
      <p>No form for this type of connector</p>
    )}
  </div>
)

const UpdateXput = (props) => {
  const templates = connectorTemplates({ mSettings: props.data, update: props.update })
  const formProps = templates.children?.[props.type + 's']?.blocks?.[props.plugin]
  const formData = props.data?.connector?.[props.type + 's']?.[props.id] || {}

  if (formProps)
    return (
      <div className="max-w-2xl w-full">
        <XputHeader id={props.plugin} title={props.id} type={props.type} action="update" />
        <FormWrapper
          {...props}
          {...formProps}
          settings={{
            plugin: props.id,
            type: props.type,
            ...formData,
          }}
          action="update"
        />
      </div>
    )

  return (
    <div className="max-w-2xl w-full">
      <XputHeader id={props.id} title={props.title} type={props.type} />
      <Popout note compact noP>
        The <b>{props.title}</b> {props.type} does not require any configuration
      </Popout>
    </div>
  )
}

const ShowXput = ({ type, id, title, setModal, desc = false }) => {
  return (
    <div className="max-w-2xl w-full">
      <XputHeader {...{ id, title, type }} />
      {desc ? (
        <p>fixme, remove connector {type} with desc</p>
      ) : (
        <Popout note>
          <h5>You cannot update or remove this {type}</h5>
          <p>
            The <b>{title}</b> connector {type} does not have any settings and cannot be removed.
          </p>
          <p className="text-center">
            <button onClick={() => setModal(false)} className="btn btn-neutral btn-outline">
              Close
            </button>
          </p>
        </Popout>
      )}
    </div>
  )
}

const XputButton = ({
  title,
  about,
  id,
  desc = false,
  btn = false,
  type,
  onClick,
  plugin = false,
  available = false,
}) => (
  <button
    className={`rounded-lg p-0 px-2 shadow hover:bg-secondary hover:bg-opacity-20 hover:cursor-pointer
      flex flex-row ${type === 'input' ? 'flex-row-reverse' : ''} gap-0 items-center`}
    onClick={onClick}
  >
    {type === 'input' && available && (
      <InputIcon className="w-12 h-12 shrink-0 grow-0 text-success -mr-4" stroke={1.25} />
    )}
    {type === 'output' && available && (
      <OutputIcon className="w-12 h-12 shrink-0 grow-0 text-success -ml-4" stroke={1.25} />
    )}
    <div className="flex flex-col items-start justify-between p-2 grow">
      <span className="capitalize text-lg font-bold">{title ? title : id}</span>
      <span className="-mt-1 text-sm italic opacity-80">{about}</span>
    </div>
    <div>
      {brands[id] ? brands[id] : brands[plugin] ? brands[plugin] : <InputIcon {...iconProps} />}
    </div>
  </button>
)

const BlockItems = (props) => {
  const { blocks, type, xputs, data } = props
  const [open, setOpen] = useState(false)
  const { setModal } = useContext(ModalContext)

  const allXputs = { ...blocks, ...(data?.connector?.[type + 's'] || {}) }

  return (
    <>
      <h4 className="capitalize">Available Connector {type}s</h4>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {Object.keys(allXputs)
          .filter((id) => allXputs[id].desc === undefined || allXputs[id].about === undefined)
          .map((id) => (
            <XputButton
              available
              key={id}
              {...{ id, type }}
              {...allXputs[id]}
              onClick={() =>
                setModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <UpdateXput {...props} {...{ type, id, setModal }} {...allXputs[id]} />
                  </ModalWrapper>
                )
              }
            />
          ))}
      </div>
      <h4 className="mt-4 capitalize">Add a Connector {type}</h4>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(blocks)
          .filter((id) => typeof blocks[id].desc !== 'undefined')
          .map((id) => (
            <XputButton
              key={id}
              {...{ id, type }}
              {...blocks[id]}
              onClick={() =>
                setModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <AddXput {...props} {...{ type, id, setModal }} {...blocks[id]} />
                  </ModalWrapper>
                )
              }
            />
          ))}
      </div>
    </>
  )
}

export const ConnectorXputs = (props) => (
  <>
    <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
    <Markdown>{props.viewConfig.about}</Markdown>
    <BlockItems blocks={props.viewConfig.blocks} type={props.type} {...props} />
  </>
)
export const ConnectorInputs = (props) => <ConnectorXputs {...props} type="input" />
export const ConnectorOutputs = (props) => <ConnectorXputs {...props} type="output" />
