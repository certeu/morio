import { preStart as preStartBroker, postStart as postStartBroker } from './services/broker.mjs'
import { preStart as preStartCa, postStart as postStartCa } from './services/ca.mjs'
import { preStart as preStartConsole } from './services/console.mjs'
import { preCreate as preCreateProxy } from './services/proxy.mjs'
//import { preStart as preStartDbuilder } from './services/dbuilder.mjs'

/*
 * Object holding lifecycle scripts
 */
export const lifecycle = {
  create: {
    pre: {
      proxy: preCreateProxy,
    },
  },
  start: {
    pre: {
      broker: preStartBroker,
      ca: preStartCa,
      console: preStartConsole,
      //dbuilder: preStartDbuilder,
    },
    post: {
      broker: postStartBroker,
      ca: postStartCa,
    },
  },
}

