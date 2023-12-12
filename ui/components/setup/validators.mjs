import schema from './schema.yaml'
import isValidHostname from 'is-valid-hostname'

export const validators = {
  'morio.node_count': (val, config) => {
    const valid = [1,3,5,7,9,11,13,15].includes(val)

    return config
      ? [valid, schema.init.next] // Init is a bit special as it's key is not the configKey
      : valid
  },
  'morio.nodes': (val, config) => {
    if (typeof val === 'string') return isValidHostname(val)

    for (const node of val) {
      if (!isValidHostname(node)) return config
        ? [false]
        : false
    }
    return config
      ? [true, schema['morio.nodes'].next]
      : true
  }
}

