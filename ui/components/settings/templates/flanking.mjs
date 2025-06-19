import Joi from 'joi'
import { arrayMembers, capitalize } from 'lib/utils.mjs'
import { useState } from 'react'
import { Popout } from 'components/popout.mjs'
import { BoolNoIcon, BoolYesIcon, TipIcon } from 'components/icons.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { StringInput, ListInput } from 'components/inputs.mjs'

const AddFlankingNode = ({ context }) => {
  const [fqdn, setFqdn] = useState('')
  const schema = Joi.string().hostname().required().label('FQDN')

  const { update, clearModal, mSettings } = context

  const add = () => {
    // Update settings
    update(
      'cluster.flanking_nodes',
      arrayMembers(mSettings.cluster.flanking_nodes || [], 'add', fqdn)
    )
    // Close modal
    clearModal()
  }

  return (
    <>
      <h5>Flanking node FQDN</h5>
      <small>Please enter the FQDN of the flanking node you want to add to this cluster</small>
      <div className="flex flex-row gap-2 items-start">
        <StringInput
          label="FQDN"
          update={setFqdn}
          current={fqdn}
          valid={() => schema.validate(fqdn)}
        />
        {/* We are adding an empty label to ensure button and input align vertically */}
        <formcontrol>
          <div className="label">
            <span className="label-text">&nbsp;</span>
          </div>
          <button
            className="btn btn-primary"
            disabled={schema.validate(fqdn)?.error ? true : false}
            onClick={add}
          >
            Add
          </button>
        </formcontrol>
      </div>
    </>
  )
}

const flankingServices = {
  cache: {
    desc: 'A ValKey instance for storing dashboard data',
    tips: [
      'Run this on a flanking node if possible.',
      'Only one instance of this service can be deployed per cluster.',
      'Enabling this service here will disable it elsewhere.',
    ],
  },
  connector: {
    desc: 'A Vector instance for interconnecting Morio',
    tips: [
      'Run this on one or more flanking nodes if possible.',
      'This service scales horizontally.',
    ],
  },
  tap: {
    desc: `Morio's low-code stream processing service`,
    tips: [
      'Run this on one or more flanking nodes if possible.',
      'This service scales horizontally.',
    ],
  },
  watcher: {
    desc: `A heartbeat instance to run healthchecks`,
    tips: [
      'Run this on a flanking node if possible.',
      'Multiple instances only add value if you want to run healthchecks from different origins (eg: different data centres).',
    ],
  },
}

const updateServiceLocation = ({ service, val, node, context }) => {
  // Cache service is special because it can only run in 1 place
  if (service === 'cache') context.update(`flanking_services.${service}.nodes`, val ? [node] : [])
  else
    context.update(
      `flanking_services.${service}.nodes`,
      arrayMembers(
        context.mSettings.flanking_services?.[service]?.nodes || [],
        val ? 'add' : 'del',
        node
      )
    )
}

const FlankingNodeForm = ({ node, context }) => {
  return (
    <div className="">
      <details className="bg-primary/20 rounded mt-4 open:bg-transparent open:border-l-4 open:shadow hover:bg-primary/30 open:hover:bg-transparent open:cusor-default border-primary group">
        <summary className="flex flex-row gap-2 items-center justify-between hover:cursor-pointer px-2 group-open:bg-primary/20">
          <h6>
            <span className="text-xs opacity-70">Flanking Node:</span> {node}
          </h6>
        </summary>
        <div className="p-2">
          <h5>Flanking Services</h5>
          <p>You can choose which (flanking) services you want to run on this node.</p>
          {Object.entries(flankingServices).map(([service, info]) => {
            const enabled = (context.mSettings.flanking_services?.[service]?.nodes || []).includes(
              node
            )
              ? true
              : false

            return (
              <>
                <h6>{capitalize(service)} Service</h6>
                <div className="grid grid-cols-2 gap-2">
                  <div className="mb-4">
                    <span className="font-bold">{info.desc}</span>
                    <ul className="list list-inside ml-2 list-disc text-sm">
                      {info.tips.map((tip) => (
                        <li key={tip} className="flex flex-row items-start gap-2">
                          <TipIcon className="w-4 h-4 text-success" /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="">
                    <ListInput
                      update={(val) => updateServiceLocation({ service, val, node, context })}
                      list={[
                        { val: true, label: 'Run on this node' },
                        { val: false, label: 'Disabled' },
                      ]}
                      current={enabled}
                      dir="row"
                      dense={true}
                      activeIcon={enabled ? <BoolYesIcon /> : <BoolNoIcon />}
                    />
                  </div>
                </div>
              </>
            )
          })}
        </div>
      </details>
    </div>
  )
}

/*
 * Flanking Nodes
 *
 * This holds the configuration wizard view settings
 * for any flanking nodes in the Morio deployment.
 */
export const flanking = (context) => {
  const flankingNodes = []
  for (const node of context.mSettings?.cluster?.flanking_nodes || []) {
    flankingNodes.push(<FlankingNodeForm node={node} context={context} />)
  }
  if (flankingNodes.length === 0)
    flankingNodes.push(
      <Popout note>
        <h5>This cluster currently has no flanking nodes</h5>
        To add a flanking node, click the <b>Add a flanking node</b> button below.
      </Popout>
    )

  const template = {
    title: 'Flanking Services',
    type: 'info',
    children: {
      nodes: {
        type: 'form',
        title: 'Flanking Nodes',
        form: [
          '### Flanking nodes',
          ...flankingNodes,
          <p className="text-center" key="p">
            <button
              onClick={() =>
                context.pushModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <AddFlankingNode context={context} />
                  </ModalWrapper>
                )
              }
              className="btn btn-primary"
            >
              Add a flanking node
            </button>
          </p>,
        ],
      },
    },
  }

  return template
}
