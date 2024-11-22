import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

/*
 * Add a banner to clarify where this code comes from
 */
const banner = `/*
 * This file is auto-generated every time the morio-tap container starts.
 * It will be overwritten at the next restart.
 *
 * Tap handlers can be loaded dynamically, which is handled by the
 * containers entrypoint which will auto-generate this file which
 * loads all tap handlers.
 *
 * A tap handler is a handler for Morio's Tap service that allows
 * you to 'tap into' the streaming data without having to write code
 * to handle streaming data.
 */`

/*
 * Helper function to glob a folder
 */
export async function globDir(folderPath, pattern = '*/index.mjs') {
  let list = []
  try {
    list = await glob(path.resolve(folderPath) + '/' + pattern)
  } catch (err) {
    if (err) console.log(err)
    return false
  }

  return list
}
/*
 * This creates a file that loads any handlers that are
 * available under /tap/handlers.
 *
 * It also makes sure that they can be loaded and have
 * the proper structure for a message handler.
 *
 * Note that files need to end with .mjs and be named in
 * a way that makes their basename suitable for use as an
 * object key name in Javascript.
 *
 * @param {string} directory - The folder to look for handlers
 * @return {object} code - The code to load topics and handlers
 */
async function loadHandlers(directory) {
  const folder = new URL(directory, import.meta.url)

  const handlers = {}
  const files = await globDir(folder.pathname)

  for (const file of files) {
    const folder = path.basename(path.dirname(file))
    handlers[folder] = new Set()
    // Dynamically import the file
    const module = await import(file)

    // Make sure the default export is a message handler
    if (module.default && typeof module.default.topic === 'string' && typeof module.default.method === 'function') {
      handlers[folder].add({
        name: folder,
        topic: module.default.topic,
        exports: 'object',
      })
    } else if (Array.isArray(module.default)) {
      for (const i in module.default) {
        const mod = module.default[i]
        if (typeof mod.topic === 'string' && typeof mod.method === 'function') {
          handlers[folder].add({
            name: `${folder}__${mod.name || i}`,
            topic: mod.topic,
            exports: 'array',
          })
        }
      }
    }

  }

  return handlers
}

async function loadHandlerFiles(directory) {
  const folder = new URL(directory, import.meta.url)

  return await globDir(folder.pathname)
}

async function ensureHandlerLoader() {
  const files = [
    ...(await loadHandlerFiles('./src/handlers')),
    ...(await loadHandlerFiles('./handlers')),
  ]
  const imports = {}
  const topics = new Set()
  for (const file of files) {
    const folder = path.basename(path.dirname(file))
    // Dynamically import the file
    const module = await import(file)
    // Is the default export a tap handler?
    if (module.default && typeof module.default.topic === 'string' && typeof module.default.method === 'function') {
      imports[folder] = [ folder, module.default.topic ]
      topics.add(module.default.topic)
    }
    // Or is it an array of tap handlers?
    else if (Array.isArray(module.default)) {
      for (const i in module.default) {
        const mod = module.default[i]
        if (typeof mod.topic === 'string' && typeof mod.method === 'function') {
          if (typeof imports[folder] === 'undefined') imports[folder] = []
          imports[folder].push([`${folder}__${mod.name || i}`, mod.topic])
          topics.add(mod.topic)
        }
      }
    }
  }

  const nl = "\n"
  const tab = "  "
  /*
   * Holds import code
   */
  let imp = `${banner}${nl}${nl}// We need a logger${nl}import { log } from './src/tools.mjs'${nl}${nl}// Tap handlers`

  /*
   * Holds allHandlers code
   */
  let ah = `${nl}${nl}/*${nl} * Simple object with all tap handlers${nl} */${nl}export const allHandlers = {`

  const hpts = {}
  for (const folder in imports) {
    imp += `${nl}import ${folder} from './src/handlers/${folder}/index.mjs'`
    // Single import
    if (typeof imports[folder][1] === 'string') {
      const [handler, topic] = imports[folder]
      if (typeof hpts[topic] === 'undefined') hpts[topic] = new Set()
      hpts[topic].add(handler)
      ah += `${nl}  ${folder},`
    }
    else if (Array.isArray(imports[folder][1])) {
      let i = 0
      for (const [handler, topic] of imports[folder]) {
        if (typeof hpts[topic] === 'undefined') hpts[topic] = new Set()
        hpts[topic].add(handler)
        ah += `${nl}  ${handler}: ${folder}[${i}], `
        i++
      }
    }
  }

  ah += `${nl}}${nl}`

  /*
   * Holds handersPerTopic code
   */
  let hpt = `${nl}/*${nl} * Same tap handlers but grouped by topic${nl} */${nl}export const handlersPerTopic = {`
  for (const [topic, handlers] of Object.entries(hpts)) {
    hpt += `${nl}  ${topic}: [`
    hpt += [...handlers].map(h => `${nl}    allHandlers.${h},`)
    hpt += `${nl}  ],`
  }
  hpt += `${nl}}`

  /*
   * Now bring it all together and write to disk
   */
  const code = `${imp}${ah}${hpt}${nl}
export const topics = ${JSON.stringify([...topics])}
export const handlerList = Object.keys(allHandlers)
`
  await fs.writeFile('./loader.mjs', code)
}

ensureHandlerLoader()

