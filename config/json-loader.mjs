/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 */
import pkg from './package.json' assert { type: 'json' }

export { pkg }

