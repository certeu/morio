/*
 * Deployment
 *
 * This holds the configuration wizard view settings
 * for the Morio deployment, which are high-level settings.
 * These are not about how to configure individual components,
 * but rather about how everything should work together
 */
export const deployment = (context) => {
  /*
   * Helper object for those configuration blocks that
   * should remain locked until we know the node_count
   */
  const nodeCountFirst = context.mConf?.deployment?.node_count
    ? false
    : ({ setView, template }) => (
        <>
          <p>
            You need to complete the <b>{template.children.node_count.title}</b> configuration block
            first.
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

  return {
    about: `The Morio deployment configuration holds the most foundational settings of your Morio setup.
  Without this configuration, Morio cannot function.`,
    title: 'Morio Deployment',
    type: 'info',
    next: 'morio.cluster',
    children: {
      /*
       * How many nodes in this deployment
       */
      node_count: {
        // Wizard view to go to next
        next: 'deployment.nodes',
        type: 'list',
        title: 'Node vs Cluster',
        input: [
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
              labels: ['5 nodes', '7 nodes', '9 nodes', '11 nodes', '13 nodes', '15 nodes'],
              label: 'Cluster nodes',
              about: 'Choose the amount of nodes in the Morio cluster',
            },
          },
        ],
      },

      /*
       * Node names
       */
      nodes: {
        type: 'strings',
        count: context.mConf?.deployment?.node_count || 1,
        label: 'Nodes',
        labels: [...Array(context.mConf?.deployment?.node_count || 0)].map(
          (i, j) => `Node ${Number(j) + 1}`
        ),
        labelsTR: [...Array(context.mConf?.deployment?.node_count || 0)].map(
          (i, j) => `Enter the fully qualified domain name of node ${Number(j) + 1}`
        ),
        about: 'Each Morio nodes needs a name that will resolve in DNS (an FQDN)',
        placeholder: 'host.my.domain.com',
        next: 'deployment.display_name',
        locked: nodeCountFirst,
      },

      /*
       * Display name
       */
      display_name: {
        type: 'string',
        label: 'Display Name',
        about: 'A human-friendly name to refer to this Morio setup',
        placeholder: 'Morio Production',
        next: context.mConf?.deployment?.node_count === 1 ? 'validate' : 'deployment.cluster_name',
      },

      /*
       * Cluster name
       */
      cluster_name: {
        type: 'string',
        label: 'Cluster Name',
        about: `A round-robin DNS record for the entire Morio cluster.
This should resolve to the IP addresses of all cluster nodes.`,
        placeholder: 'cluster.my.domain.com',
        next: 'deployment.leader_ip',
        hide: context.mConf?.deployment?.node_count === 1,
        locked: nodeCountFirst,
      },

      /*
       * Leader IP address
       */
      leader_ip: {
        type: 'string',
        label: 'Leader IP Address',
        about: `In addition to the name, we need the IP address of the leader node (this node).`,
        placeholder: '10.0.0.1',
        suggest: {
          macro: 'validateNode',
          label: 'Use this value?',
          about: `We attempted to determine the IP address of a potential leader node.
If this is the correct IP, you can accept this suggestion.
Or, if you like you can enter an IP address manually.`,
        },
        next: 'validate',
        hide: context?.Mconf?.deployment ? context.mConf?.deployment?.node_count === 1 : true,
        locked: nodeCountFirst,
      },
    },
  }
}
