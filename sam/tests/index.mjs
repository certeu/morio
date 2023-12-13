import { setup } from './shared.mjs'
import { tests as setupTests } from './setup.mjs'
import { tests as statusTests } from './status.mjs'

const runTests = async (props) => {
  await statusTests(props)
  await setupTests(props)
}

// Load initial data required for tests
const props = await setup()

// Note run the tests using this data
runTests(props)
