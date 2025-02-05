// Dependencies
import { capitalize, slugify } from 'lib/utils.mjs'
import { vectorTemplates } from './lib.mjs'
// Hooks
import { useState } from 'react'
// Components
import { Details } from 'components/details.mjs'
import { Popout } from 'components/popout.mjs'
import { PlusCircleIcon, TrashIcon } from 'components/icons.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { StringInput, YamlInput } from 'components/inputs.mjs'
import { KeyVal } from 'components/keyval.mjs'

const NewVector = ({ type, context }) => {
  const [id, setId] = useState('')
  const [template, setTemplate] = useState(false)

  const add = () => {
    context.update(`connector.${type}s.${id}`, vectorTemplates[type][template])
    context.clearModal()
  }

  return (
    <div className="">
      <h3>New Connector {capitalize(type)}</h3>
      <StringInput
        label={`${capitalize(type)} ID`}
        labelBL={`We need a unique ID to identify this ${type}`}
        update={(val) => setId(slugify(val))}
        current={id}
      />
      <h5>Select a template to start from</h5>
      <div className="flex flex-row flex-wrap gap-1 items-center">
        {Object.keys(vectorTemplates[type]).map((name) => (
          <KeyVal
            k={type}
            val={name}
            onClick={() => setTemplate(name)}
            key={name}
            color={name === template ? 'success' : 'info'}
          />
        ))}
      </div>
      <p className="text-center mt-4">
        <button className="btn btn-primary" disabled={!(id && template)} onClick={add}>
          Add {capitalize(type)}
        </button>
      </p>
    </div>
  )
}

const DynamicForm = ({ type, context }) => (
  <>
    <Popout tip compact>
      Refer to{' '}
      <a
        href={`https://vector.dev/docs/reference/configuration/${type}s/`}
        target="_BLANK"
        rel="nofollow"
      >
        the Vector {type}s documentation
      </a>{' '}
      for all details.
    </Popout>
    <div>
      {Object.keys(context.mSettings?.connector?.[`${type}s`] || {}).map((id) => (
        <Details
          key={id}
          summaryLeft={id}
          summaryRight={
            <button
              className="btn btn-error btn-sm"
              onClick={() => context.update(`connector.${type}s.${id}`, undefined)}
            >
              <TrashIcon className="w-5 h-5" /> Remove
            </button>
          }
        >
          <div className="p-2">
            <YamlInput
              data={context.mSettings.connector[`${type}s`][id]}
              update={(val) => context.update(`connector.${type}s.${id}`, val)}
            />
          </div>
        </Details>
      ))}
    </div>
    <p className="mt-4 text-right">
      <button
        className="btn btn-primary"
        onClick={() =>
          context.pushModal(
            <ModalWrapper keepOpenOnClick>
              <NewVector type={type} context={context} />
            </ModalWrapper>
          )
        }
      >
        <PlusCircleIcon />
        <span className="pl-4">Add {capitalize(type)}</span>
      </button>
    </p>
  </>
)

/*
 * Connector
 *
 * This holds the configuration wizard view settings for the
 * connector (Vector) specific config.
 * We call it connector but it's Vector under the hood
 */
export const connector = (context) => ({
  about:
    'This configuration allows you to connect this Morio to other Morio deployments, or other data processing or storgage systems.',
  title: 'Connector',
  type: 'info',
  children: {
    /*
     * Sources
     */
    sources: {
      type: 'form',
      title: 'Connector Sources',
      form: [<DynamicForm type="source" context={context} key="source" />],
    },

    /*
     * Sinks
     */
    sinks: {
      type: 'form',
      title: 'Connector Sinks',
      form: [<DynamicForm type="sink" context={context} key="sink" />],
    },

    /*
     * Filters
     */
    transforms: {
      type: 'form',
      title: 'Connector Transforms',
      form: [<DynamicForm type="transform" context={context} key="transform" />],
    },
  },
})
