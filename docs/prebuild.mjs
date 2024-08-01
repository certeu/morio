import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
// OpenAPI specifications
import { spec as apiSpec } from '../api/openapi/index.mjs'
import { spec as coreSpec } from '../core/openapi/index.mjs'
// Presets
import { presets } from '../config/presets.mjs'
// Errors
import { errors as apiErrors } from '../api/src/errors.mjs'
import { errors as coreErrors } from '../core/src/errors.mjs'
// Utils
import { globDir, mkdir, writeFile } from  '../shared/src/fs.mjs'

// Combine errors
const errors = { ...apiErrors, ...coreErrors }

/*
 * Helper method to write out OpenAPI specification files
 */
const writeOpenAPISpecs = async () => {
  for (const [name, spec] of Object.entries({
    api: apiSpec,
    core: coreSpec,
  })) await writeFile(`./static/oas-${name}.yaml`, yaml.dump(spec))
}

/*
 * Helper method to wrap auto-generated content in opening and closing comments
 * This allows us to update it should we ever need to, even if the page has been hand-edited.
 */
const wrapAutoGeneratedContent = (content) => `
<!-- MORIO_AUTO_GENERATED_CONTENT_STARTS - Manual changes made below will be overwritten -->
${content}
<!-- MORIO_AUTO_GENERATED_CONTENT_ENDS - Manual changes made above will be overwritten -->
`

/*
 * Helper method to construct the page title with optional tags
 */
const pageTitle = (title, tags) => "---\ntitle: " + title + "\n" + (tags
  ? ("tags: \n" + tags.map(tag => ` - ${tag}`).join("\n") + "\n")
  : '') + "---\n\n"


/*
 * Helper method to create/ensure pages for all presets
 */
const ensurePresetPages = async () => {
  const root = path.resolve('./docs/reference/presets')
  const pages = (await globDir(root)).map(page => page.split(`${root}/`).pop())

  /*
   * Make sure all presets have their page
   */
  for (const [key, val] of Object.entries(presets)) {
    const slug = key.toLowerCase()
    /*
     * Create the folder if it does not exist
     */
    if (!pages.includes(`/${slug}`)) await mkdir(`${root}/${slug}`)
    /*
     * Create the page if it does not exist
     */
    if (!pages.includes(`/${key.toLowerCase()}/readme.md`)) await createPresetPage(key, slug, root)
  }

  /*
   * Make sure only existing presets have their page under /docs/reference/presets
   */
  const allPresets = Object.keys(presets)
  for (const page of pages) {
    const name = page.split('/').shift()
    if (name !== 'readme.md' && !allPresets.includes(name.toUpperCase()))
      console.log(`🔥🔥 Preset page ${name} exists, but there is no such Morio preset. Remove page? 🔥🔥`)
  }
}

/*
 * Helper method to create a preset page
 */
const createPresetPage = async (preset, slug, root) => await writeFile(`${root}/${slug}/readme.md`,
  pageTitle(preset, ['preset']) +
  "\n\n" +
  wrapAutoGeneratedContent(`| Name | Default Value |
|------|---------------|
| \`${preset}\` | ${renderPresetValue(presets[preset])} |`))

const renderPresetValue = (val) => {
  if (['number', 'string'].includes(typeof val)) return `\`${val}\``
  if (Array.isArray(val)) return `<ul>${val.map(item => "<li>"+item+"</li>").join(" ")}</ul>`
  else return `<pre>${JSON.stringify(val, null, 2)}</pre>`
}

/*
 * Shared header to include in written .mjs files
 */
export const header = `#
# This file was auto-generated by the prebuild script
# Any changes you make to it will be lost on the next (pre)build.
#
`

/*
 * Helper method to create/ensure pages for all errors
 */
const ensureErrorsPages = async () => {
  const root = path.resolve('./docs/reference/errors')
  const pages = (await globDir(root)).map(page => page.split(`${root}/`).pop())

  /*
   * Make sure all errors have their page
   */
  for (const [key, val] of Object.entries(errors)) {
    const slug = key.toLowerCase()
    /*
     * Create the folder if it does not exist
     */
    if (!pages.includes(`/${slug}`)) await mkdir(`${root}/${slug}`)
    /*
     * Create the page if it does not exist
     */
    if (!pages.includes(`/${key.toLowerCase()}/readme.md`)) await createErrorPage(errors[key], slug, root)
  }

  /*
   * Make sure only existing presets have their page under /docs/reference/presets
   */
  const allErrors = Object.keys(errors)
  for (const page of pages) {
    const name = page.split('/').shift()
    if (name !== 'readme.md' && !allErrors.includes(name))
      console.log(`🔥🔥 Error page ${name} exists, but there is no such Morio error. Remove page? 🔥🔥`)
  }
}

/*
 * Helper method to create an error page
 */
const createErrorPage = async (error, slug, root) => await writeFile(`${root}/${slug}/readme.md`,
  pageTitle(slug, ['error']) +
  wrapAutoGeneratedContent(`__${error.title}__ - ${error.detail}`) +
  "\n" +
  wrapAutoGeneratedContent(`## Example response

\`\`\`json
${JSON.stringify({
  type: presets.MORIO_ERRORS_WEB_PREFIX + slug,
  ...error
}, null, 2)}
\`\`\``))

/*
 * Main method that does what needs doing for the docs
 */
export const prebuildDocs = async () => {
  /*
   * OpenAPI specs
   */
  await writeOpenAPISpecs()

  /*
   * Presets
   */
  await ensurePresetPages()

  /*
   * Errors
   */
  await ensureErrorsPages()
}

prebuildDocs()
