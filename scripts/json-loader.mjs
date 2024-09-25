/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 */
// Load various package.json files
import root from '../package.json' assert { type: 'json' }
import api from '../api/package.json' assert { type: 'json' }
import config from '../config/package.json' assert { type: 'json' }
import core from '../core/package.json' assert { type: 'json' }
import shared from '../shared/package.json' assert { type: 'json' }
import ui from '../ui/package.json' assert { type: 'json' }

export { root, api, config, core, shared, ui }
