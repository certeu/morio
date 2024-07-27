/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 * See: https://github.com/eslint/eslint/discussions/15305#discussioncomment-8181665
 */
import pkg from '../package.json' with { type: 'json' }

export { pkg }
