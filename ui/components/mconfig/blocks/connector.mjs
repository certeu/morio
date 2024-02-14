import get from 'lodash.get'
import { useState, useContext } from 'react'
import { Markdown } from 'components/markdown.mjs'
import { AmazonCloudWatch, Azure, Elasticsearch, Kafka } from 'components/brands.mjs'
import {
  CodeIcon,
  ConnectorIcon,
  EmailIcon,
  HttpIcon,
  InputIcon,
  MorioIcon,
  OutputIcon,
  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { connect as schema } from '#schema/config'
import Joi from 'joi'
import { FormBlock } from 'components/mconfig/blocks/form.mjs'
import { useStateObject } from 'hooks/use-state-object.mjs'
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
  morio_remote: <MorioIcon {...brandProps} className="w-8 h-8 text-warning" />,
  morio_local: <MorioIcon {...brandProps} className="w-8 h-8 text-success" />,
  sink: <TrashIcon {...iconProps} />,
}

const AddConnector = (props) => (
  <div className="max-w-2xl w-full">
    <h3 className="flex flex-row justify-between items-center w-full">
      {brands[props.id] ? brands[props.id] : <span>No icon for {props.id}</span>}
      <span>
        <b>{props.title}</b> {props.type}
      </span>
      {props.type === 'input' ? (
        <InputIcon className="w-12 h-12" stroke={1.25} />
      ) : (
        <OutputIcon className="w-12 h-12" stroke={1.25} />
      )}
    </h3>
    {props.desc ? (
      props.form ? (
        <FormWrapper {...props} />
      ) : (
        <p>No form found</p>
      )
    ) : (
      <Popout note>
        <h5>You cannot update or remove this {props.type}</h5>
        <p>
          The <b>{props.title}</b> Connector {props.type} does not require any configuration and
          cannot be removed.
        </p>
        <p className="text-center">
          <button onClick={() => props.setModal(false)} className="btn btn-neutral btn-outline">
            Close
          </button>
        </p>
      </Popout>
    )}
  </div>
)

const UpdateConnector = ({ type, id, title, setModal, desc = false }) => {
  return (
    <div className="max-w-2xl w-full">
      <h3 className="flex flex-row justify-between items-center">
        {brands[id] ? brands[id] : <span>No icon for {id}</span>}
        <span>
          <b>{title}</b> {type}
        </span>
        {type === 'input' ? (
          <InputIcon className="w-12 h-12" stroke={1.25} />
        ) : (
          <OutputIcon className="w-12 h-12" stroke={1.25} />
        )}
      </h3>
      {desc ? (
        <p>fixme, remove connector {type} with desc</p>
      ) : (
        <Popout note>
          <h5>You cannot update or remove this {type}</h5>
          <p>
            The <b>{title}</b> connector {type} does not require any configuration and cannot be
            removed.
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

const AddButton = ({ title, about, id, desc = false, btn = false, type, onClick }) => (
  <button className="`border rounded-lg p-0 shadow">
    <div
      className={`flex flex-row items-center hover:cursor-pointer px-4 py-2 justify-between w-full
      hover:bg-secondary hover:bg-opacity-20 rounded-lg'}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-start w-full justify-between">
        <span className="capitalize text-lg">
          <b>{title}</b> {type}
        </span>
        <span className="-mt-1 text-sm italic opacity-80">{about}</span>
      </div>
      {brands[id] ? brands[id] : <span>No icon for {id}</span>}
    </div>
  </button>
)

const BlockItems = (props) => {
  const { blocks, type } = props
  const [open, setOpen] = useState(false)
  const { setModal } = useContext(ModalContext)

  return (
    <>
      <h4 className="capitalize">Available Connector {type}s</h4>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(blocks)
          .filter((id) => typeof blocks[id].desc === 'undefined')
          .map((id) => (
            <AddButton
              key={id}
              {...{ id, type }}
              {...blocks[id]}
              onClick={() =>
                setModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <UpdateConnector {...props} {...{ type, id, setModal }} {...blocks[id]} />
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
            <AddButton
              key={id}
              {...{ id, type }}
              {...blocks[id]}
              onClick={() =>
                setModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <AddConnector {...props} {...{ type, id, setModal }} {...blocks[id]} />
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
