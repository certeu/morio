import { setup } from './shared.mjs'
import { tests as dockerTests } from './core-docker.mjs'
import { tests as createContainer } from './core-create-container.mjs'
import { tests as containerTests } from './core-container.mjs'
import { tests as containerStateTests } from './core-container-state.mjs'
import { tests as setupTests } from './setup.mjs'
import { tests as statusTests } from './status.mjs'

/* eslint-disable no-undef */

const runTests = async (props) => {
  await dockerTests(props)
  await createContainer(props)
  await containerTests(props)
  await containerStateTests(props)
  await statusTests(props)
  await setupTests(props)
}

// Load initial data required for tests
const props = await setup()

// Note run the tests using this data
runTests(props)

/* eslint-enable no-undef */
