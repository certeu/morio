import { readJsonFile } from './fs.mjs'

/*
 * Eslint does not (yet) support import assertions, so let's just load it ourselves
 */
//import pkg from '../../package.json' assert { type: 'json' }
const pkg = await readJsonFile('package.json')

export { pkg }

