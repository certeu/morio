/*
 * Configuration for the morio_inventory handler
 */
export const config = {
  enabled: true,
  handler: {
    topic: 'metrics',
    filter: ({ data }) => data?.morio?.inventory_update ? true : false,
  },
}

export const docs = {
  name: 'Morio Inventory Handler',
  description: `
This stream processing handler processes Morio inventory updates, which are provided by metrics, and builds out an inventory.
`,
  config: {
    enabled: "Set this to false to disable this handler.",
  }
}

