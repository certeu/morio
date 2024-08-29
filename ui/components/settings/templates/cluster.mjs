import Joi from 'joi'
import { Popout } from 'components/popout.mjs'

/*
 * Cluster
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
export const cluster = (context, toggleValidate) => {
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
              Sizing: [
                `### Choose your deployment size`,
                {
                  key: 'TMP.node_count',
                  schema: Joi.number()
                    .valid(1, 3, 5, 7, 9)
                    .required()
                    .label('Node Count'),
                  inputType: 'buttonList',
                  title: 'Node vs Cluster',
                  lockOnEdit: true,
                  list: [
                    {
                      val: 1,
                      label: 'Morio Standalone Deployment',
                      about: `
- Setup a standalone Morio node
- Recommended for small deployments
- Provides a simpler setup with less moving parts
`,
                    },
                    {
                      val: 3,
                      label: 'Morio Clustered Deployment',
                      about: `
- Setup a Morio cluster with 3 broker nodes
- Recommended for larger deployments
- Provides high availibility
`,
                    },
                    {
                      label: 'Morio Large Cluster Deployment',
                      about: `
- Setup a Morio cluster with 5, 7, or 9 broker nodes
- Recommended for increased throughput
- Size matters, but bigger is not always better
`,
                      hide: 'Show larger cluster sizes',
                      val: {
                        type: 'select',
                        values: [5, 7, 9],
                        labels: ['5 broker nodes', '7 broker nodes', '9 broker nodes'],
                        label: 'Cluster nodes',
                        about: 'Choose the amount of broker nodes in the Morio cluster',
                      },
                    },
                  ],
                },
              ],
              Names: [
                '### Name your Morio deployment',
                '##### A global display name for this Morio deployment',
                {
                  key: 'cluster.name',
                  schema: Joi.string().required().label('Display Name'),
                  label: 'Display Name',
                  labelBL: 'A human-friendly name to refer to this Morio setup',
                  lockOnEdit: true,
                  placeholder: 'Morio Production',
                },
                '&nbsp;',
                '##### DNS names for the nodes in this deployment',
              ].concat(
                context.TMP?.node_count
                  ? [...Array(context.TMP?.node_count || 0)].map((un, i) => ({
                      key: `cluster.broker_nodes.${i}`,
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
                '### Cluster settings',
                '##### Cluster Name',
                'This name should resolve to the IP addresses of all cluster nodes.',
                {
                  key: 'cluster.fqdn',
                  label: 'Cluser Name',
                  labelBL: 'A fully qualified domain name for the entire Morio cluster',
                  labelBR: (
                    <span className="italic opacity-70">
                      Create a round-robin A record for this
                    </span>
                  ),
                  schema: Joi.string().hostname().required().label('Cluster Name'),
                },
              ],
              Validate: [
                '### Pre-flight check: All systems go?',
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

  if (!context.TMP?.node_count || context.TMP.node_count < 2) {
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
