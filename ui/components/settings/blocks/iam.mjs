import { useState, useContext } from 'react'
import { Markdown } from 'components/markdown.mjs'
//import { AmazonCloudWatch, Azure, Elasticsearch, Kafka } from 'components/brands.mjs'
//// Templates
//import { connector as connectorTemplates } from '../templates/connector/index.mjs'
import {
  //  CodeIcon,
  //  EmailIcon,
  //  HttpIcon,
  FingerprintIcon,
  ClosedLockIcon,
  MorioIcon,
  //  PlusIcon,
  //  RightIcon,
  //  RssIcon,
  StorageIcon,
  UserIcon,
  //  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
//import { Popout } from 'components/popout.mjs'
//import Joi from 'joi'
//import set from 'lodash.set'
import { FormWrapper, loadFormDefaults } from './form.mjs'
//import { slugify } from 'lib/utils.mjs'

const brandProps = { fill: 1, stroke: 0, className: 'w-8 h-8' }
const iconProps = { fill: 0, stroke: 1.5, className: 'w-8 h-8' }

const brands = {
  mrt: <MorioIcon {...iconProps} />,
  ldap: <StorageIcon {...iconProps} />,
  local: <UserIcon {...iconProps} />,
  apikeys: <ClosedLockIcon {...iconProps} />,
}

const ProviderHeader = ({ id, title }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    {brands[id] ? brands[id] : <FingerprintIcon {...iconProps} />}
    <span>
      <b>{title}</b>
    </span>
    <FingerprintIcon className="w-12 h-12" stroke={1.25} />
  </h3>
)

const AddProvider = (props) => {
  const defaults = loadFormDefaults({ provider: props.id }, props.form)

  return (
    <div className="max-w-2xl w-full">
      <ProviderHeader id={props.id} title={props.title} />
      {props.form ? (
        <FormWrapper {...props} defaults={defaults} action="create" local={true} />
      ) : (
        <p>No form for this type of identity provider</p>
      )}
    </div>
  )
}

const UpdateProvider = (props) => {
  const { provider } = props
  const defaults = loadFormDefaults(props.data.iam.providers[props.id], props.blocks[provider].form)

  const removeLocal = () => {
    props.update(`iam.providers.${props.id}`, 'MORIO_UNSET')
    props.popModal()
  }

  return (
    <div className="max-w-2xl w-full">
      <ProviderHeader id={props.id} title={props.title} />
      {props.blocks?.[provider]?.form ? (
        <FormWrapper
          {...props}
          form={props.blocks[provider].form}
          defaults={defaults}
          action="update"
          local={props.blocks[provider].local}
          freeze={['id']}
          {...{ removeLocal }}
        />
      ) : (
        <p>No form for this type of identity provider</p>
      )}
    </div>
  )
}

const ProviderButton = ({ title, about, id, type, onClick, plugin = false, available = false }) => (
  <div className="indicator w-full">
    <button
      className={`rounded-lg p-0 px-2 shadow hover:bg-secondary hover:bg-opacity-20 hover:cursor-pointer w-full
        flex flex-row gap-0 items-center`}
      onClick={onClick}
    >
      <div className="flex flex-col items-start justify-between p-2 grow text-left">
        <span className="capitalize text-lg font-bold">{title ? title : id}</span>
        <span className="-mt-1 text-sm italic opacity-80">{about}</span>
      </div>
      <div>{brands[type] ? brands[type] : <FingerprintIcon {...iconProps} />}</div>
    </button>
  </div>
)

export const AuthProviders = (props) => {
  const { blocks, data } = props
  const { pushModal, popModal } = useContext(ModalContext)

  return (
    <>
      <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
      <Markdown>{props.viewConfig.about}</Markdown>
      {data?.iam?.providers ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.keys(data?.iam?.providers).map((id) => (
            <ProviderButton
              available
              key={id}
              id={id}
              type={data.iam.providers[id].provider}
              {...data.iam.providers[id]}
              onClick={() =>
                pushModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <UpdateProvider
                      {...props}
                      {...{ id, pushModal, popModal }}
                      {...data.iam.providers[id]}
                    />
                  </ModalWrapper>
                )
              }
            />
          ))}
        </div>
      ) : null}
      <h4 className="mt-4 capitalize">Add an identity provider</h4>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(blocks).map((id) => (
          <ProviderButton
            key={id}
            id={id}
            type={id}
            {...blocks[id]}
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                  <AddProvider {...props} {...{ id, pushModal, popModal }} {...blocks[id]} />
                </ModalWrapper>
              )
            }
          />
        ))}
      </div>
    </>
  )
}
