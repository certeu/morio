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
  PipelineIcon,
  PlusIcon,
  RightIcon,
  RssIcon,
  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import Joi from 'joi'
import set from 'lodash.set'
import { FormWrapper, FormElement, loadFormDefaults } from './form.mjs'
import { TextInput, StringInput } from 'components/inputs.mjs'
import { slugify } from 'lib/utils.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { reduceFormValidation } from './form.mjs'

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

const AddXput = (props) => {
  const defaults = loadFormDefaults(
    {
      plugin: props.id,
      type: props.type,
    },
    props.form
  )

  return (
    <div className="max-w-2xl w-full">
      <XputHeader id={props.id} title={props.title} type={props.type} />
      {props.form ? (
        <FormWrapper {...props} defaults={defaults} action="create" />
      ) : (
        <p>No form for this type of connector</p>
      )}
    </div>
  )
}

const xputPipelineList = (id, type, data) => {
  if (!data.connector.pipelines) return false
  const list = []
  for (const [pipelineId, config] of Object.entries(data.connector.pipelines)) {
    if (config[type]?.id === id) list.push(pipelineId)
  }

  return list.length > 0 ? list : false
}

const UpdateXput = (props) => {
  const templates = connectorTemplates({ mSettings: props.data, update: props.update })
  const formProps = templates.children?.[props.type + 's']?.blocks?.[props.plugin]
  const formData = props.data?.connector?.[props.type + 's']?.[props.id] || {}
  const defaults = loadFormDefaults(
    {
      plugin: props.id,
      type: props.type,
    },
    formProps.form
  )

  const removeLocal = props.pipelines
    ? false
    : () => {
        props.update(`connector.inputs.${props.id}`, 'MORIO_UNSET')
        props.setModal(false)
      }

  if (formProps)
    return (
      <div className="max-w-2xl w-full">
        <XputHeader id={props.plugin} title={props.id} type={props.type} action="update" />
        <FormWrapper
          {...props}
          {...formProps}
          removeLocal={removeLocal}
          defaults={{ ...defaults, ...formData }}
          action="update"
        />
        {props.pipelines ? (
          <Popout note>
            <b>
              The <em>{props.id}</em> {props.type} is used in the following pipelines:
            </b>
            <ul className="list list-inside list-disc ml-4">
              {props.pipelines.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
            <small>
              You cannot remove an {props.type} that is in use. You need to remove the pipeline
              first.
            </small>
          </Popout>
        ) : null}
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
  pipelines = false,
}) => (
  <div className="indicator w-full">
    {pipelines.length > 0 ? (
      <span className="indicator-item badge badge-success mr-6">{pipelines.length}</span>
    ) : null}
    <button
      className={`rounded-lg p-0 px-2 shadow hover:bg-secondary hover:bg-opacity-20 hover:cursor-pointer w-full
        flex flex-row ${type === 'input' ? 'flex-row-reverse' : ''} gap-0 items-center
        ${pipelines ? 'bg-success bg-opacity-20' : ''}`}
      onClick={onClick}
    >
      {type === 'input' && available && (
        <InputIcon className="w-12 h-12 shrink-0 grow-0 text-success -mr-4" stroke={1.25} />
      )}
      {type === 'output' && available && (
        <OutputIcon className="w-12 h-12 shrink-0 grow-0 text-success -ml-4" stroke={1.25} />
      )}
      <div className="flex flex-col items-start justify-between p-2 grow text-left">
        <span className="capitalize text-lg font-bold">{title ? title : id}</span>
        <span className="-mt-1 text-sm italic opacity-80">{about}</span>
      </div>
      <div>
        {brands[id] ? brands[id] : brands[plugin] ? brands[plugin] : <InputIcon {...iconProps} />}
      </div>
    </button>
  </div>
)

const BlockItems = (props) => {
  const { blocks, type, xputs, data } = props
  const [open, setOpen] = useState(false)
  const { setModal } = useContext(ModalContext)

  const allXputs = { ...blocks, ...(data?.connector?.[type + 's'] || {}) }

  return (
    <>
      {Object.keys(allXputs).filter(
        (id) => allXputs[id].desc === undefined || allXputs[id].about === undefined
      ).length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.keys(allXputs)
            .filter((id) => allXputs[id].desc === undefined || allXputs[id].about === undefined)
            .map((id) => {
              const pipelines = xputPipelineList(id, type, props.data)

              return (
                <XputButton
                  available
                  key={id}
                  {...{ id, type, pipelines }}
                  {...allXputs[id]}
                  onClick={() =>
                    setModal(
                      <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                        <UpdateXput
                          {...props}
                          {...{ type, id, setModal, pipelines }}
                          {...allXputs[id]}
                        />
                      </ModalWrapper>
                    )
                  }
                />
              )
            })}
        </div>
      ) : null}
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

const PipelineHeader = ({ id, title, type }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    <InputIcon className="w-12 h-12" stroke={1.25} />
    Pipeline {id}
    <OutputIcon className="w-12 h-12" stroke={1.25} />
  </h3>
)

const PipelineButton = ({
  type, // Either input our output
  id, // Current picked id
  setter, // Setter method
}) => (
  <button className={`btn btn-ghost btn-primary`} onClick={() => setter(null)}>
    {id ? id : type === 'input' ? 'Select an input below' : 'Select an output below'}
  </button>
)

const PipelineConnectors = ({ pipelineSettings, data, localUpdate }) => {
  const btnClasses = 'btn btn-sm w-full flex flex-row justify-between items-center'

  return (
    <>
      <div className="flex flex-row justify-center w-full items-center">
        <button
          className={`btn btn-ghost btn-primary text-lg italic ${
            pipelineSettings.input?.id ? 'text-success hover:text-error' : 'opacity-70'
          }`}
          onClick={() => localUpdate('input.id', null)}
        >
          {pipelineSettings.input?.id || 'Select an input below'}
        </button>
        <div className="col-span-1 flex flex-row gap-1 items-center justify-center">
          <RightIcon className="h-5 w-5" />
          <RightIcon className="h-5 w-5 -ml-4" />
          <RightIcon className="h-5 w-5 -ml-4" />
        </div>
        <button
          className={`btn btn-ghost btn-primary text-lg italic ${
            pipelineSettings.output?.id ? 'text-success hover:text-error' : 'opacity-70'
          }`}
          onClick={() => localUpdate('output.id', null)}
        >
          {pipelineSettings.output?.id || 'Select an output below'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <h4>Pipeline Inputs</h4>
          {Object.keys(data?.connector?.inputs || {}).map((id) => (
            <button
              className={`${btnClasses} ${
                pipelineSettings.input?.id === id ? 'btn-success' : 'btn-neutral btn-outline'
              }`}
              onClick={() => localUpdate('input.id', id)}
              key={id}
            >
              {id}
              <InputIcon stroke={1.5} className="w-8 h-8" />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <h4>Pipeline Outputs</h4>
          {Object.keys(data?.connector?.outputs || {}).map((id) => (
            <button
              className={`${btnClasses} ${
                pipelineSettings.output?.id === id ? 'btn-success' : 'btn-neutral btn-outline'
              }`}
              onClick={() => localUpdate('output.id', id)}
              key={id}
            >
              <OutputIcon stroke={1.5} className="w-8 h-8" />
              {id}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

const AddPipeline = (props) => {
  const [pipelineSettings, setPipelineSettings] = useState(props.edit ? props.settings : {})

  const templates = connectorTemplates({
    mSettings: props.data,
    update: props.update,
    pipelineSettings,
  })

  const create = () => {
    // Keep the id out of the settings as the key will be the id
    const settings = { ...pipelineSettings }
    delete settings.id
    props.update(`connector.pipelines.${pipelineSettings.id}`, settings, props.data)
    props.setModal(false)
  }
  const remove = (id) => {
    props.update(`connector.pipelines.${id}`, 'MORIO_UNSET', props.data)
    props.setModal(false)
  }
  const localUpdate = (key, val) => {
    console.log('locally setting', key, 'to', val)
    const newSettings = { ...pipelineSettings }
    set(newSettings, key, val)
    setPipelineSettings(newSettings)
  }
  const inputPlugin = props.data.connector.inputs?.[pipelineSettings.input?.id]?.plugin
  const outputPlugin = props.data.connector.outputs?.[pipelineSettings.output?.id]?.plugin

  const form = [
    {
      tabs: {
        Connectors: [
          <PipelineConnectors key="pc" data={props.data} {...{ pipelineSettings, localUpdate }} />,
        ],
        Metadata: [
          {
            schema: Joi.string().required().label('ID'),
            update: (val) => localUpdate('id', slugify(val)),
            current: pipelineSettings?.id,
            placeholder: 'my-pipeline',
            label: 'ID',
            labelBL: 'A unique ID to reference this pipeline',
            labelBR: <span className="italic opacity-70">Input will be slugified</span>,
            key: 'id',
            disabled: props.edit,
          },
          {
            schema: Joi.string().optional().allow('').label('Description'),
            update: (val) => localUpdate('about', val),
            label: 'Description',
            labelBL: 'A description to help understand the purpose of this pipeline',
            labelBR: <span className="italic opacity-70">Optional</span>,
            key: 'about',
            current: pipelineSettings?.about,
            inputType: 'textarea',
          },
        ],
        'Input Settings': templates.children.inputs.blocks?.[inputPlugin]?.pipeline_form ? (
          templates.children.inputs.blocks?.[inputPlugin]?.pipeline_form({
            update: localUpdate,
            data: pipelineSettings,
          })
        ) : (
          <p className="text-center font-bold italic opacity-70">
            This input requires no pipeline-specific configuration
          </p>
        ),
        'Output Settings': templates.children.outputs.blocks?.[outputPlugin]?.pipeline_form ? (
          templates.children.outputs.blocks?.[outputPlugin]?.pipeline_form({
            update: localUpdate,
            data: pipelineSettings,
          })
        ) : (
          <p className="text-center font-bold italic opacity-70">
            This output requires no pipeline-specific configuration
          </p>
        ),
      },
    },
  ]
  const valid = reduceFormValidation(form, pipelineSettings)

  return (
    <div className="max-w-2xl w-full">
      <PipelineHeader id={props.id} />
      <FormWrapper {...props} form={form} update={localUpdate} />
      <div className="mt-2 flex flex-row gap-2 items-center justify-center">
        <button className="btn btn-primary px-12" onClick={create} disabled={!valid}>
          {props.edit ? 'Update' : 'Create'} Pipeline
        </button>
        {props.edit ? (
          <button className="btn btn-error" onClick={() => remove(props.id)}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
    </div>
  )
}

const ShowPipeline = (props) => (
  <button
    className="max-w-4xl w-full grid grid-cols-3 gap-2 items-center border rounded-lg hover:bg-secondary hover:bg-opacity-20 mb-2"
    onClick={() =>
      props.setModal(
        <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
          <AddPipeline
            {...props}
            settings={{ ...props.data.connector.pipelines[props.id], id: props.id }}
            edit
          />
        </ModalWrapper>
      )
    }
  >
    <div className="bg-secondary p-2 rounded-l-lg font-bold text-right bg-opacity-50">
      {props.id}
    </div>
    <div className="col-span-2 flex flex-row items-center justify-start">
      <b>
        <em>{props.data.connector.pipelines[props.id].input.id}</em>
      </b>
      <div className="flex flex-row items-center justify-center">
        <RightIcon className="h-4 w-4 text-success" stroke={2} />
        <RightIcon className="h-4 w-4 -ml-3 text-success" stroke={2} />
        <RightIcon className="h-4 w-4 -ml-3 text-success" stroke={2} />
      </div>
      <b>{props.data.connector.pipelines[props.id].output.id}</b>
    </div>
  </button>
)

export const ConnectorPipelines = (props) => {
  const { setModal } = useContext(ModalContext)

  return (
    <>
      <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
      {Object.keys(props.data?.connector?.pipelines || {}).map((id) => {
        return <ShowPipeline key={id} {...props} id={id} setModal={setModal} />
      })}
      <button
        className="btn btn-primary"
        onClick={() =>
          setModal(
            <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
              <AddPipeline {...props} setModal={setModal} edit={false} />
            </ModalWrapper>
          )
        }
      >
        <PlusIcon className="w-6 h-6 mr-4" stroke={3} /> Add Pipeline
      </button>
    </>
  )
}
