import { readFile, writeFile } from '@morio/shared/fs'
import path from 'path'
import chalk from 'chalk'
import readline from 'node:readline'
// Load various package.json files
import root from '../package.json' assert { type: 'json' }
import api from '../api/package.json' assert { type: 'json' }
import config from '../config/package.json' assert { type: 'json' }
import core from '../core/package.json' assert { type: 'json' }
import schema from '../schema/package.json' assert { type: 'json' }
import shared from '../shared/package.json' assert { type: 'json' }
import ui from '../ui/package.json' assert { type: 'json' }

/*
 * Object holding all files we need to update and their folder
 */
const files = {
  '.': root,
  api,
  config,
  core,
  schema,
  shared,
  ui
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
    promises.push(writeFile(`${folder}/package.json`, JSON.stringify({...config, version}, null, 2)+"\n"))
  }
  await Promise.all(promises)
  rl.close()
})


