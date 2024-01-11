
/*
 * Eslint does not (yet) support import assertions, so let's just load it ourselves
 */
import pkg from '../../package.json' assert { type: 'json' }
//import { readJsonFile } from './fs.mjs'
//const pkg = await readJsonFile('package.json')

export { pkg }

