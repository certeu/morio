import { writeFile } from '@morio/shared/fs'
import chalk from 'chalk'
import readline from 'node:readline'
import process from 'node:process'
// Load various package.json files
import { root, api, config, core, shared, ui } from './json-loader.mjs'

/*
 * Object holding all files we need to update and their folder
 */
const files = {
  '.': root,
  api,
  config,
  core,
  shared,
  ui,
}

console.log(`
${chalk.white('The current version is:')} ${chalk.yellow.bold(root.version)}
`)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question(`Enter a new version number: `, async (version) => {
  console.log(`Setting version to ${version}`)
  const promises = []
  for (const [folder, config] of Object.entries(files)) {
    promises.push(
      writeFile(`${folder}/package.json`, JSON.stringify({ ...config, version }, null, 2) + '\n')
    )
  }
  await Promise.all(promises)
  rl.close()
})
