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
 * A tap handler is a handler for Morio's Tap service that allows
 * you to 'tap into' the streaming data without having to write code
 * to handle streaming data.
 *
 * Tap handlers can dynamically be extended, and load code that is
 * (for example) preseeded from a git repository.
 * This is handled by the containers entrypoint script which will
 * auto-generate files like this one.
 */`

// Whitespace to re-use
const nl = "\n"
const tab = "  "

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

async function loadHandlerFiles(directory, pattern) {
  const folder = new URL(directory, import.meta.url)

  return await globDir(folder.pathname, pattern)
}

function asTopicList (input) {
  if (typeof input === 'string') return [input]
  if (Array.isArray(input)) return input
  if (typeof input === 'object') return Object.values(input)

  return []
}

async function ensureHandlerLoader() {
  const files = await loadHandlerFiles('./handlers')
  const imports = {}
  const topics = new Set()
  for (const file of files) {
    const folder = path.basename(path.dirname(file))

    /*
     * Dynamically import the file. ESM is nice these days.
     */
    const module = await import(file)

    /*
     * Handlers can be a single handler object, or an array of them
     */
    if (Array.isArray(module.default)) {
      for (const i in module.default) {
        const mod = module.default[i]
        if (mod.enabled){
          const subs = asTopicList(mod.topics)
          for (const topic of subs) topics.add(topic)
          if (typeof imports[folder] === 'undefined') imports[folder] = []
          imports[folder].push([`${folder}__${i}`, subs])
        }
      }
    }
    else if (module.default.enabled){
      const subs = asTopicList(module.default.topics)
      for (const topic of subs) topics.add(topic)
      imports[folder] = [ folder, subs ]
    }
  }

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
    imp += `${nl}import ${folder} from './handlers/${folder}/index.mjs'`
    if (typeof imports[folder][0] === 'string') {
      for (const topic of imports[folder][1]) {
        if (typeof hpts[topic] === 'undefined') hpts[topic] = new Set()
        hpts[topic].add(folder)
      }
      ah += `${nl}  ${folder}: ${folder}, `
    }
    else if (Array.isArray(imports[folder][0])) {
      let i = 0
      for (const entry of imports[folder]) {
        for (const topic of entry[1]) {
          if (typeof hpts[topic] === 'undefined') hpts[topic] = new Set()
          hpts[topic].add(entry[0])
        }
        ah += `${nl}  ${folder}__${i}: ${folder}[${i}], `
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
    for (const h of [...handlers]) {
      if (Array.isArray(h)) {
        for (const hh of h) hpt += `${nl}    allHandlers.${hh},`
      }
      else hpt += `${nl}    allHandlers.${h},`
    }
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

async function ensureModuleLoaders() {
  const files = await loadHandlerFiles('./handlers', '*/modules/*.mjs')
  const imports = {}
  for (const file of files) {
    /*
     * We glob all files in one pass,
     * but we need to manage them per handler
     */
    const handler = path.basename(path.dirname(path.dirname(file)))
    if (typeof imports[handler] === 'undefined') imports[handler] = {}
    const filename = path.basename(file)
    if (filename.slice(-4) === '.mjs') {
      const module = filename.slice(0,-4)
      if (module !== 'index') {
        const importName = module.replaceAll('-', '_')
        imports[handler][module] = {
          imp: `import ${importName} from './${filename}'`,
          exp: `  "${module}": ${importName}`
        }
      }
    }
  }

  /*
   * Now write out the index.mjs loader files
   */
  for (const handler in imports) {
    const code = `${banner}
${Object.values(imports[handler]).map(h => h.imp).join(nl)}${nl}
export default {${nl}${Object.values(imports[handler]).map(h => h.exp).join(nl)}${nl}}${nl}`
    await fs.writeFile(`./handlers/${handler}/modules/index.mjs`, code)
  }
}

ensureHandlerLoader()
ensureModuleLoaders()

