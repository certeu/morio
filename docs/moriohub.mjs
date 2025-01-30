/*
 * This is a work in progress
 */
import { readFile, writeFile } from '../shared/src/fs.mjs'
import fetch from 'node:fetch' // Import fetch for HTTP requests

// Function to download the JSON file from the GitHub release URL
async function downloadMoriohubData() {
  const url = 'https://github.com/certeu/moriohub/releases/latest/download/moriohub.json' // URL to download the JSON
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch moriohub.json from GitHub. Status: ${response.status}`)
  }

  const data = await response.json() // Parse the response as JSON
  return data
}

const pageData = (data, children, type) => `
import Layout from '@theme/Layout'
import { HubEntry } from '@site/src/components/moriohub/entry.js'
import notes from '@site/hubnotes/${type}/${data.title}.mdx'

const data = ${JSON.stringify(data, null, 2)}

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
  try {
    // Fetch the JSON data from GitHub
    const data = await downloadMoriohubData()

    // Write the data to local files
    await writeFile(
      './prebuild/moriohub.mjs',
      `export const moriohub = ${JSON.stringify(data, null, 2)}`
    )

    // Generate pages for modules, overlays, and processors
    for (const [name, module] of Object.entries(data.modules)) {
      await writeFile(
        `./src/pages/hub/modules/${name}.js`,
        pageData(
          { title: name, ...module },
          `<HubEntry data={data} type="module" notes={notes} />`,
          'modules'
        )
      )
      await ensureFile(`./hubnotes/modules/${name}.mdx`)
    }

    for (const [name, overlay] of Object.entries(data.overlays)) {
      await writeFile(
        `./src/pages/hub/overlays/${name}.js`,
        pageData(
          { title: name, ...overlay },
          `<HubEntry data={data} type="overlay" notes={notes} />`,
          'overlays'
        )
      )
      await ensureFile(`./hubnotes/overlays/${name}.mdx`)
    }

    for (const [name, processor] of Object.entries(data.processors)) {
      await writeFile(
        `./src/pages/hub/processors/${name}.js`,
        pageData(
          { title: name, ...processor },
          `<HubEntry data={data} type="processor" notes={notes} />`,
          'processors'
        )
      )
      await ensureFile(`./hubnotes/processors/${name}.mdx`)
    }
  } catch (error) {
    console.error('Error fetching or processing moriohub.json:', error)
  }
}

async function ensureFile(file) {
  let result = false
  try {
    result = await readFile(file)
  } catch (err) {
    // This is fine
  }
  if (result === false) await writeFile(file, '---\n---')
}
