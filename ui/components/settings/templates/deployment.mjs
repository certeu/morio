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
  const template = {
    title: 'Morio Initial Setup',
    type: 'info',
    lockOnEdit: true,
    children: {
      setup: {
        type: 'form',
        lockOnEdit: true,
        title: 'Morio Deployment',
        form: [
          {
            linearTabs: true,
            setupOnly: true,
            tabs: {
              Size: [
                '### __Size__: Standalone or Cluster?',
                `##### Choose your deployment size`,
                {
                  key: 'deployment.node_count',
                  schema: Joi.number()
                    .valid(1, 3, 5, 7, 9, 11, 13, 15)
                    .required()
                    .label('Node Count'),
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
              Names: [
                '### __Names__: One global, and one for each node',
                '##### A global display name for this Morio deployment',
                {
                  key: 'deployment.display_name',
                  schema: Joi.string().required().label('Display Name'),
                  label: 'Display Name',
                  labelBL: 'A human-friendly name to refer to this Morio setup',
                  lockOnEdit: true,
                  placeholder: 'Morio Production',
                },
                '&nbsp;',
                '##### DNS names for the nodes in this deployment',
              ].concat(
                context.deployment?.node_count
                  ? [...Array(context.deployment?.node_count || 0)].map((un, i) => ({
                      key: `deployment.nodes.${i}`,
                      label: `Node ${i + 1} FQDN`,
                      labelBL: `Enter the fully qualified domain name of node ${i + 1}`,
                      placeholder: `morio-node${i + 1}.my.domain.com`,
                      lockOnEdit: true,
                      schema: Joi.string().hostname().required().label('FQDN'),
                    }))
                  : [
                      <Popout tip key={1}>
                        <h5>You need to choose a cluster size first</h5>
                        <p>
                          Once you have chosen a cluster size, you can enter the node names here.
                        </p>
                      </Popout>,
                    ]
              ),
              Cluster: [
                '### __Cluster__: Requires a few extra settings',
                '##### Cluster Name',
                'This name should resolve to the IP addresses of all cluster nodes.',
                {
                  key: 'deployment.fqdn',
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
                `The IPv4 address of the leader node (this node).`,
                {
                  key: 'deployment.leader_ip',
                  label: 'Leader IP Address',
                  labelBL: 'An IPv4 address',
                  schema: Joi.string()
                    .ip({ version: 'ipv4', cidr: 'forbidden' })
                    .required()
                    .label('Leader IP Address'),
                },
              ],
              Validate: [
                '### __Validate__: All systems go?',
                'Before we deploy Morio using these settings, we will run a series of validation tests.',
                'No changes will be made at this time. Click below to start the tests.',
                <p className="text-center" key={1}>
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
    delete template.children.setup.form[0].tabs.Cluster
  }
  if (!toggleValidate) delete template.children.setup.form[0].tabs['Validate Settings']
  if (context.version) {
    delete template.children.setup.form
    template.children.setup.type = 'mdx'
    template.children.setup.mdx = [
      '### Morio Deployment',
      'These settings cannot be changed. You can review the current settings at [/settings/show](/settings/show).',
    ]
  }

  return template
}
