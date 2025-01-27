/*
 * This is a work in progress
 */
import path from 'node:path'
import { globDir, readFile, writeFile, writeJsonFile } from '../shared/src/fs.mjs'
import yaml from 'yaml'

const settings = {
  folder: './moriohub',
}

const load = {
  modules: async () => {
    const dir = path.resolve(`${settings.folder}/modules`)
    const list = (await globDir(dir)).filter(entry => entry.slice(-4) === '.yml')
    const data = {}
    for (const file of list) {
      const contents = await readFile(file)
      let moriodata = false
      try {
        const yml = yaml.parse(contents)
        if (Array.isArray(yml)) moriodata = yml.filter(entry => entry.moriodata ? true : false).pop().moriodata
      }
      catch (err) {
        console.log(err, `Failed to parse file as yaml: ${file}`)
      }
      if (moriodata) {
        const entry = {
          module: path.parse(file.slice(dir.length + 1).split('/')[2]).name,
          type: 'template',
          subtype: 'input',
          agent: file.slice(dir.length + 1).split('/')[0],
          location: file.slice(dir.length),
          moriodata,
        }
        if (typeof data[entry.module] === 'undefined') data[entry.module] = {}
        if (typeof data[entry.module][entry.agent] === 'undefined') {
          data[entry.module][entry.agent] = entry
        }
        else {
          console.log(
            `Double entry for module ${entry.module} agent ${entry.agent}`,
            { first: data[entry.module], second: entry }
          )
          exit(1)
        }
      }
      else {
        if (!contents.split("\n")[0].includes(' noop')) console.log(contents)
      }
    }

    return data
  },
  overlays: async () => {
    const dir = path.resolve(`${settings.folder}/overlays`)
    const list = (await globDir(dir)).filter(entry => entry.slice(-5) === '.yaml')
    const data = {}
    for (const file of list) {
      const contents = await readFile(file)
      let moriodata = false
      let raw = false
      try {
        raw = yaml.parse(contents)
        if (raw?.moriodata) {
          moriodata = raw.moriodata
          delete raw.moriodata
        }
      }
      catch (err) {
        console.log(err, `Failed to parse file as yaml: ${file}`)
      }
      if (moriodata) {
        const name = path.parse(file.slice(dir.length + 1)).name
        const entry = {
          location: name,
          moriodata,
          raw: yaml.stringify(raw),
        }
        if (typeof data[name] === 'undefined') data[name] = entry
        else {
          console.log(
            `Double entry for overlay ${name}`,
            { first: data[name], second: entry }
          )
          exit(1)
        }
      }
      else console.log(contents)
    }

    return data
  },
  processors: async () => {
    const dir = path.resolve(`${settings.folder}/processors`)
    const list = (await globDir(dir)).filter(entry => entry.slice(-4) === '.mjs')
    const data = {}
    for (const file of list) {
      const chunks = file.slice(dir.length + 1).split('/')
      const d = {}
      d.type = chunks.length === 2 ? 'processor' : 'module'
      d.name = d.type === 'processor' ? chunks[0] : path.parse(chunks[2]).name
      if (d.type !== 'processor') d.processor = chunks[0]
      const esm = await import(file)
      if (esm.info) d.moriodata = { ...esm.info, settings: undefined }
      if (d.type === 'processor') {
        if (typeof data[d.name] === 'undefined') data[d.name] = d
        else {
          console.log(
            `Double entry for processor ${name}`,
            { first: data[d.name], second: d }
          )
          exit(1)
        }
      } else if (d.name !== 'index'){
        if (typeof data[d.processor] === 'undefined') data[d.processor] = { }
        if (typeof data[d.processor].modules === 'undefined') data[d.processor].modules = {}
        data[d.processor].modules[d.name] = d
      }
    }

    return data
  },
}

const pageData = (data, children, type) => `
import Layout from '@theme/Layout'
import { HubEntry } from '@site/src/components/moriohub/entry.js'
import notes from '@site/hubnotes/${type}/${data.title}.mdx'

const data = ${JSON.stringify(data, null ,2)}

export default function HubPage() {
  return (
    <Layout title={data.title} description={data.about}>
      <div className="tailwind">
        <div className="max-w-5xl mx-auto mb-12 px-4">
          ${children}
        </div>
      </div>
    </Layout>
  )
}
`

export async function prebuildMoriohubContent() {
  const root = path.resolve(settings.folder)
  const data = {
    modules: await load.modules(),
    overlays: await load.overlays(),
    processors: await load.processors(),
    //watchers: await globDir(`${settings.folder}/watchers`),
  }
  await writeFile('./prebuild/moriohub.mjs', `export const moriohub = ${JSON.stringify(data, null, 2)}`)
  await writeJsonFile('./static/moriohub.json', data)

  for (const [name, module] of Object.entries(data.modules)) {
    await writeFile(
      `./src/pages/hub/modules/${name}.js`,
      pageData({ title: name, ...module },
      `<HubEntry data={data} type="module" notes={notes} />`,
      'modules'
      )
    )
    await ensureFile(`./hubnotes/modules/${name}.mdx`)
  }
  for (const [name, overlay] of Object.entries(data.overlays)) {
    await writeFile(
      `./src/pages/hub/overlays/${name}.js`,
      pageData({ title: name, ...overlay },
      `<HubEntry data={data} type="overlay" notes={notes} />`,
      'overlays'
      )
    )
    await ensureFile(`./hubnotes/overlays/${name}.mdx`)
  }
  for (const [name, overlay] of Object.entries(data.processors)) {
    await writeFile(
      `./src/pages/hub/processors/${name}.js`,
      pageData({ title: name, ...overlay },
      `<HubEntry data={data} type="processor" notes={notes} />`,
      'processors'
      )
    )
    await ensureFile(`./hubnotes/processors/${name}.mdx`)
  }
}

async function ensureFile(file) {
  let result = false
  try {
    result = await readFile(file)
  }
  catch (err) {
    // This is fine
  }
  if (result === false) await writeFile(file, "---\n---")
}
