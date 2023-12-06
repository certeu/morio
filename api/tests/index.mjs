import { setup } from './shared.mjs'
import { tests as setupTests } from './setup.mjs'

const runTests = async (props) => {
  await setupTests(props)
}

// Load initial data required for tests
const props = await setup()

// Note run the tests using this data
runTests(props)
