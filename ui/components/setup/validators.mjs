import schema from './schema.yaml'
import isValidHostname from 'is-valid-hostname'
import defaults from 'config/shared/morio-defaults.yaml'

export const validators = {
  'morio.node_count': (val, config) => {
    const valid = defaults.MORIO_NODES_VALID.includes(val)

    return config
      ? [valid, schema.init.next] // Init is a bit special as it's key is not the configKey
      : valid
  },
  'morio.nodes': (val, config) => {
    /*
     * If all we get is a string, this is the individual input validation
     */
    if (typeof val === 'string') return isValidHostname(val)

    /*
     * Check for duplicates in node names
     */
    if (val.length !== [...new Set(val)].length) return config ? [false] : false

    /*
     * Check each node name to ensure it's valid
     */
    for (const node of val) {
      if (!isValidHostname(node)) return config ? [false] : false
    }
    return config ? [true, schema['morio.nodes'].next] : true
  },
  'morio.display_name': (val, config) => {
    const valid = typeof val === 'string' && val.length > 1

    return config ? [valid, schema['morio.display_name'].next] : valid
  },
  'morio.cluster_name': (val, config) => {
    const valid = isValidHostname(val)

    return config ? [valid, schema['morio.cluster_name'].next] : valid
  },
}
