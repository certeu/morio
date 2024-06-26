/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 */

/*
 * Load the MRT straight from disk, so that these tests can
 * run without having to go through the setup each time.
 * Note that this is only possible when running the dev container.
 */
import keys from '../../data/config/keys.json' assert { type: 'json' }

export { keys }
