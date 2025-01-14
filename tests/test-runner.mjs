import { spawn } from 'child_process'
import path from 'path'

const args = process.argv.slice(2)

// Ensure a test name is provided
if (args.length === 0) {
  console.error('Usage: node testRunner.mjs <testName>')
  console.error('Example: node testRunner.mjs ephemeral')
  process.exit(1)
}

const testName = args[0]

// Map test names to file paths
const testFiles = {
  ephemeral: './tests/10_ephemeral.test.mjs',
  setup: './tests/20_setup.test.mjs',
  create: './tests/25_create-test-account.test.mjs',
  anonymous: './tests/30_anonymous.test.mjs',
  settings: './tests/35_settings.test.mjs', // FIXME included
  docker: './tests/40_docker.test.mjs', // FIXME included
  local: './tests/50_idp-local.test.mjs',
  apikey: './tests/51_idp-apikey.test.mjs',
  mrt: './tests/52_idp-mrt.test.mjs',
  ldap: './tests/53_idp-ldap.test.mjs', // not even started
  crypto: './tests/60_crypto.test.mjs',
  kv: './tests/70_kv.test.mjs',
}

const testFile = testFiles[testName]
if (!testFile) {
  console.error(`Error: Test "${testName}" not found.`)
  console.error(`Available tests: ${Object.keys(testFiles).join(', ')}`)
  process.exit(1)
}

// Resolve the test file path
const testPath = path.resolve(testFile)

// Spawn a child process to run the test
const child = spawn('node', [testPath], { stdio: 'inherit' })

child.on('close', (code) => {
  process.exit(code) // Exit with the same code as the test process
})
