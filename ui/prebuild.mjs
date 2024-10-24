import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
//import orderBy from 'lodash/orderBy.js'
import set from 'lodash/set.js'

/*
 * Shared header to include in written .mjs files
 */
export const header = `/*
 * This file was auto-generated by the prebuild script
 * Any changes you make to it will be lost on the next (pre)build.
 */
`

/*
 * This is the fast and low-tech way to some frontmatter from all files in a folder
 */
const loadFolderFrontmatter = async (key, cwd, pages = {}) => {
  /*
   * When going through a small number of files in a flat directory (eg. blog posts) a
   * recursive grep through all files is faster.
   * But the biggest task is combing through all the documentation and for this
   * it's much faster to first run find to limit the number of files to open
   */
  const cmd = `find . -type f -name "*.mdx" -exec grep "^${key}:" -ism 1 {} +`
  const grep = exec(cmd, { cwd, maxBuffer: 2048 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error} - ${stderr}`)
      return
    }

    return stdout
  })

  /*
   * Stdout is buffered, so we need to gather all of it
   */
  let stdout = ''
  for await (const data of grep.stdout) stdout += data

  /*
   * Turn all matches into an array
   */
  const matches = stdout.split('\n').map((match) =>
    match
      .slice(2)
      .split(':')
      .filter((val, i) => i !== 1)
      .map((val) => (val.slice(-4) === '.mdx' ? val.slice(0, -4).trim() : val.trim()))
      .map((val, i) => (i === 0 ? `docs/${val}` : val))
      .map((val, i) => (i === 0 && val.slice(-6) === '/index' ? val.slice(0, -6) : val))
      .filter((slug) => slug !== 'index')
  )

  /*
   * Turns matches into structured data
   */
  for (let match of matches) {
    if (match.length === 2) {
      if (typeof pages[match[0]] === 'undefined') pages[match[0]] = {}
      pages[match[0]][key] = match[1]
    }
  }

  return pages
}

/*
 * Merges in order key on those slugs that have it set
 */
const mergeDocs = (pages) => {
  const navs = {}
  for (const slug of Object.keys(pages).sort())
    set(navs, slug.split('/'), {
      t: pages[slug].title,
      o: (pages[slug].order || '') + pages[slug].title,
    })

  return navs
}

/*
 * Loads all docs files, titles and order
 */
const loadDocs = async () => {
  /*
   * Figure out what directory to spawn the child process in
   */
  const cwd = await path.resolve(process.cwd(), 'pages', 'docs')
  const pages = await loadFolderFrontmatter('title', cwd)
  await loadFolderFrontmatter('order', cwd, pages)

  return mergeDocs(pages)
}

/*
 * Main method that does what needs doing for the docs
 */
export const prebuildDocs = async () => {
  /*
   * Navigation structure
   */
  const navs = await loadDocs()
  fs.writeFileSync(
    path.resolve('.', 'prebuild', `docs-navs.mjs`),
    `${header}export const docsNavs = ${JSON.stringify(navs)}`
  )

  /*
   * Terminology
   */
  const terms = Object.keys(navs.docs.reference.terminology).filter(
    (key) => !['t', 'o'].includes(key)
  )
  const _import = terms
    .map((term) => `import * as ${term} from 'pages/docs/reference/terminology/${term}.mdx'`)
    .join('\n')
  const _export = `
export const terminology = { ${terms.map((term) => '\n  ' + term).join(',')}
}
`
  fs.writeFileSync(
    path.resolve('.', 'prebuild', `terminology.mjs`),
    header + _import + '\n' + _export
  )
}

prebuildDocs()
