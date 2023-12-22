import { setup } from './shared.mjs'
import { tests as dockerTests } from './sam-docker.mjs'
import { tests as createContainer } from './sam-create-container.mjs'
import { tests as containerTests } from './sam-container.mjs'
import { tests as containerStateTests } from './sam-container-state.mjs'
import { tests as setupTests } from './setup.mjs'
import { tests as statusTests } from './status.mjs'

const runTests = async (props) => {
  await dockerTests(props)
  await createContainer(props)
  await containerTests(props)
  await containerStateTests(props)
  //await statusTests(props)
  //await setupTests(props)
}

// Load initial data required for tests
const props = await setup()

// Note run the tests using this data
runTests(props)
