import Joi from 'joi'
import { Popout } from 'components/popout.mjs'

/*
 * Deployment
 *
 * This holds the configuration wizard view settings
 * for the Morio deployment, which are high-level settings.
 * These are not about how to configure individual components,
 * but rather about how everything should work together
 *
 * When running the initial setup, these are the only choices
 * the user should make. So you can also think of this as the
 * setup template.
 */
export const deployment = (context, toggleValidate) => {
  /*
   * Helper object for those settings blocks that
   * should remain locked until we know the node_count
   */
  const nodeCountFirst = context.mConf?.deployment?.node_count
    ? false
    : ({ setView, template }) => (
        <>
          <p>
            You need to complete the <b>{template.children.node_count.title}</b> settings first.
          </p>
          <p className="text-right">
            <button
              className="btn btn-warning px-8"
              onClick={() => setView('deployment/node_count')}
            >
              Fix it
            </button>
          </p>
        </>
      )

  const template = {
    title: 'Morio Initial Setup',
    type: 'info',
    lockOnEdit: true,
    children: {
      setup: {
        type: 'form',
        title: 'fixme',
        form: [
          {
            linearTabs: true,
            tabs: {
              'Deployment Type': [
                {
                  key: 'deployment.node_count',
                  schema: Joi.number(),
                  inputType: 'buttonList',
                  title: 'Node vs Cluster',
                  lockOnEdit: true,
                  list: [
                    {
                      val: 1,
                      label: 'Morio Node',
                      about: `
- Setup a standalone Morio node
- Recommended for small deployments
- Provides a simpler setup with less moving parts
`,
                    },
                    {
                      val: 3,
                      label: 'Morio Cluster',
                      about: `
- Setup a 3-node Morio cluster
- Recommended for larger deployments
- Provides high availibility and horizontal scaling
`,
                    },
                    {
                      label: 'Larger Morio cluster sizes',
                      about: `
- Setup a larger Morio cluster
- Recommended for increased throughput
- Size matters, but bigger is not always better
`,
                      hide: 'Show larger Morio cluster sizes',
                      val: {
                        type: 'select',
                        values: [5, 7, 9, 11, 13, 15],
                        labels: [
                          '5 nodes',
                          '7 nodes',
                          '9 nodes',
                          '11 nodes',
                          '13 nodes',
                          '15 nodes',
                        ],
                        label: 'Cluster nodes',
                        about: 'Choose the amount of nodes in the Morio cluster',
                      },
                    },
                  ],
                },
              ],
              Names: (context.deployment?.node_count
                ? [...Array(context.deployment?.node_count || 0)].map((un, i) => ({
                    key: `nodes.${i}`,
                    label: `Node ${i + 1} FQDN`,
                    labelBL: `Enter the fully qualified domain name of node ${i + 1}`,
                    placeholder: `morio-node${i + 1}.my.domain.com`,
                    lockOnEdit: true,
                    schema: Joi.string().hostname().required().label('FQDN'),
                  }))
                : [
                    <Popout tip>
                      <h5>You need to choose a cluster size first</h5>
                      <p>Once you have chosen a cluster size, you can enter the node names here.</p>
                    </Popout>,
                  ]
              ).concat([
                {
                  key: 'display_name',
                  schema: Joi.string().required().label('Display Name'),
                  label: 'Display Name',
                  labelBL: 'A human-friendly name to refer to this Morio setup',
                  lockOnEdit: true,
                  placeholder: 'Morio Production',
                },
              ]),
              'Cluster Settings': [
                '##### Cluster Name',
                'This name should resolve to the IP addresses of all cluster nodes.',
                {
                  key: 'depoyment.fqdn',
                  label: 'Cluser Name',
                  labelBL: 'A fully qualified domain name for the entire Morio cluster',
                  labelBR: (
                    <span className="italic opacity-70">
                      Create a round-robin A record for this
                    </span>
                  ),
                  schema: Joi.string().hostname().required().label('Cluster Name'),
                },
                '&nbsp;',
                '##### Leader IP Address',
                `In addition to the name, we need the IP address of the leader node (this node).`,
                {
                  key: 'deployment.leader_ip',
                  label: 'Leader IP Address',
                  labelBL: 'A fully qualified domain name for the entire Morio cluster',
                  labelBR: (
                    <span className="italic opacity-70">
                      Create a round-robin A record for this
                    </span>
                  ),
                  schema: Joi.string()
                    .ip({ version: 'ipv4', cidr: 'forbidden' })
                    .required()
                    .label('Leader IP Address'),
                },
              ],
              'Validate Settings': [
                '## Validate Settings',
                'No changes will be made to your Morio setup at this time.  ' +
                  `
                Instead, the settings you created will be validated to detect potential issues.`,
                'If you are ready, click below to start the validation',
                <p className="text-center">
                  <button className="btn btn-primary btn-lg px-12 mt-4" onClick={toggleValidate}>
                    Validate Morio Settings
                  </button>
                </p>,
              ],
            },
          },
        ],
      },
    },
  }

  if (!context.deployment?.node_count || context.deployment.node_count < 2) {
    delete template.children.setup.form[0].tabs['Cluster Settings']
  }
  if (!toggleValidate) delete template.children.setup.form[0].tabs['Validate Settings']

  return template
}
