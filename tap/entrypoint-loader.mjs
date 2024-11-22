import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

/*
 * Add a banner to clarify where this code comes from
 */
const banner = `/*
 * This file is auto-generated when the container starts
 * and will be overwritten at the next restart
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

  const handlers = new Set()
  const files = await globDir(folder.pathname)

  for (const file of files) {
    // Dynamically import the file
    const module = await import(file)

    // Make sure the default export is a message handler
    if (module.default && typeof module.default.topic === 'string' && typeof module.default.method === 'function') {
      handlers.add({
        name: path.basename(path.dirname(file)),
        topic: module.default.topic
      })
    }
  }

  return handlers
}

async function ensureHandlerLoader() {
  const builtIn = await loadHandlers('./src/handlers')
  const custom = await loadHandlers('./handlers')

  let code = banner + "\nimport { log } from './src/tools.mjs'\n"
  const topics = new Set()
  const handlers = new Set()
  for (const { name, topic } of builtIn) {
    if (!custom.has(name)) {
      code += `import ${name} from './src/handlers/${name}/index.mjs'` + "\n"
      topics.add(topic)
      handlers.add(name)
    }
  }
  for (const { name, topic } of custom) {
    code += `import ${name} from './handlers/${name}/index.mjs` + "\n"
    topics.add(topic)
    handlers.add(name)
  }
  code += `
const allHandlers = { ${[...handlers].join(",")} }
/*
 * We organise the message handlers per topic
 * This allows us to dispatch faster when there are
 * message handlers subscribed to different topics.
 */
export const handlers = {}
for (const [name, handler] of Object.entries(allHandlers)) {
  log.debug(\`Message handler \${name} loaded for topic \${handler.topic}\`)
  if (typeof handlers[handler.topic] === 'undefined') handlers[handler.topic] = new Set()
  handlers[handler.topic].add({ ...handler, name })
}

export const topics = ${JSON.stringify([...topics])}

export const handlerList = Object.keys(allHandlers)
`

  await fs.writeFile('./loader.mjs', code)
}

ensureHandlerLoader()

