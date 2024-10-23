import { testUrl } from './network.mjs'
import set from 'lodash/set.js'
import yaml from 'js-yaml'
import { Buffer } from 'node:buffer'
import { simpleGit } from 'simple-git'
import { hash } from './crypto.mjs'
import { rm, mkdir, readFile, globDir } from './fs.mjs'

/*
 * A collection of utils to load various files
 * Typically used to load the preseeded config
 */

/**
 * Helper method to parse a result as YAML or JSON
 *
 * @param {string} input - The input to parse
 * @param {bool} base64 - Whether or not the input is base64 encoded
 * @return {object|bool} - The object resulting from parsing input as YAML or JSON, or false if we failed
 */
function asJsonOrYaml(input, base64 = false) {
  const data = base64 ? Buffer.from(input, 'base64').toString('utf-8') : input
  try {
    const yml = yaml.load(data)
    if (yml) return yml
  } catch (err) {
    // So it's not yaml
  }
  try {
    const json = JSON.parse(data)
    if (json) return json
  } catch (err) {
    // So it's not json either?
  }

  return false
}

/**
 * Determines whether a file should be read from an API (github or gitlab)
 *
 * @param {string} url - The configured 'url' (not a real url)
 * @param {bool} result - True if it ends with "@{github/gitlab]"
 */
function fromApi(url) {
  const chunks = url.split('@')
  const api = chunks.length > 1 ? chunks.pop() : false

  return api && ['github', 'gitlab'].includes(api) ? api : false
}

/**
 * Determines whether a file should be read from a local git repo
 *
 * @param {string} url - The configured 'url' (not a real url)
 * @param {bool} result - True if it starts with 'git:'
 */
function fromRepo(url) {
  return url.slice(0, 4) === 'git:'
}

/**
 * Determines whether a file should be read from a local git repo
 *
 * @param {string} pattern - The glob pattern
 * @param {string} repo - The repo ID (key in the preseed.git object)
 * @param {string} gitroot - Folder holding the cloned git repos
 * @param {array} found - Found files
 */
async function globFromRepo(pattern, repo, gitroot) {
  const found = await globDir(`${gitroot}/${sanitizeGitFolder(repo)}`, pattern)

  const data = []
  for (const file of found) {
    const content = await readFile(file)
    data.push(asJsonOrYaml(content))
  }

  return data
}

/**
 * Helper method to clone a git repository
 *
 * @param {string} gitroot - Folder in which to place the subfolder holding the repo
 * @param {string} id - id of this git repo in the preseed settings
 * @param {object} config - git preseed config
 * @param {object} log - Logger object
 */
async function loadGitRepo(gitroot, id, config, log) {
  const git = simpleGit({ baseDir: gitroot })
  const folder = sanitizeGitFolder(id)
  const dir = `${gitroot}/${folder}`
  let url

  if (config.url.slice(0, 7) === 'http://' && config.user && config.token) {
    url = `http://${config.user}:${config.token}@${config.url.slice(7)}`
  } else if (config.url.slice(0, 8) === 'https://') {
    url = `https://${config.user}:${config.token}@${config.url.slice(8)}`
  } else url = config.url

  /*
   * Ensure target folder exists and is empty
   */
  try {
    await rm(dir, { recursive: true, force: true }) // Do not mutate, just rm and re-clone
    await mkdir(dir, console.log)
  } catch (err) {
    log.warn(err, `Unable to create folder for git: ${dir}`)
    return false
  }

  /*
   * Now clone the repo
   */
  try {
    const cloneOptions = ['--depth=1', '--recurse-submodules', '--shallow-submodules']
    if (config.ref) cloneOptions.push([`--branch=${config.ref}`])
    await git.clone(url, dir, cloneOptions)
  } catch (err) {
    log.warn(err, `Unable to clone git repo ${config.id}: ${config.url}`)
    return false
  }

  return true
}

/**
 * Helper method to load a preseed base file
 *
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @return {object} settings - The loaded settings
 */
async function loadPreseedBaseFile(preseed, gitroot) {
  if (typeof preseed === 'string') return await loadPreseedFileFromUrl(preseed)
  if (typeof preseed.url === 'string') return await loadPreseedFileFromUrl(preseed)
  if (typeof preseed.base === 'string') {
    if (preseed.git && fromRepo(preseed.base))
      return await loadPreseedFileFromRepo(preseed.base, preseed, gitroot)
    else return await loadPreseedFileFromUrl(preseed.base)
  }
  if (preseed.base?.gitlab) return await loadPreseedFileFromGitlab(preseed.base)
  if (preseed.base?.github) return await loadPreseedFileFromGithub(preseed.base)
  if (preseed.base?.url) return await loadPreseedFileFromUrl(preseed.base)

  return false
}

/**
 * Helper method to load preseeded settings
 *
 * @param {object} preseed - The preseed settings
 * @param {object} log - A logger instance
 * @param {string} gitroot - Folder in which to clone git repos
 * @return {object} config - The loaded config
 */
export async function loadPreseededSettings(preseed, log, gitroot = '/etc/morio/shared') {
  /*
   * If there's a git config, we need to handle that first
   */
  if (preseed.git) {
    for (const [id, config] of Object.entries(preseed.git)) {
      await loadGitRepo(gitroot, id, config, log)
    }
  }

  /*
   * Attempt to load the preseed base file
   */
  const settings = await loadPreseedBaseFile(preseed, gitroot)
  if (!settings) {
    log.warn(`Failed to load preseed base file`)
    return false
  } else log.debug(`Loaded preseed base file`)

  /*
   * Load any preseed overlays
   */
  const overlays = await loadPreseedOverlays(preseed, gitroot, log)

  /*
   * Now merge overlays into base settings
   */
  const count = overlays.length
  let i = 0
  for (const overlayConfig of overlays) {
    i++
    log.debug(`Loaded preseed overlay ${i}/${count}`)
    for (const [path, value] of Object.entries(overlayConfig)) {
      set(settings, path, value)
    }
  }

  return settings
}

/**
 * Helper method to ensure preseeded content is available on disk
 *
 * @param {object} preseed - The preseed settings
 * @param {object} log - A logger instance
 * @param {string} gitroot - Folder in which to clone git repos
 * @return {object} config - The loaded config
 */
export async function ensurePreseededContent(preseed, log, gitroot = '/etc/morio/shared') {
  /*
   * If there's a git config, we need to fetch it
   */
  if (preseed.git) {
    for (const [id, config] of Object.entries(preseed.git)) {
      await loadGitRepo(gitroot, id, config, log)
    }
  }
}

/**
 * Helper method to load a preseed file from the Github API
 *
 * @param {object} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromGithub(config) {
  const result = await testUrl(
    `${config.github.url || 'https://api.github.com'}/repos/${config.github.owner}/${config.github.repo}/contents/${encodeURIComponent(config.github.file_path)}?ref=${config.github.ref}`,
    {
      returnError: true,
      ignoreCertificate: config.verify_certificate === false ? true : false,
      timeout: 4500,
      returnAs: 'json',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: config.github.token ? `Bearer ${config.github.token}` : undefined,
      },
    }
  )

  return typeof result.content === 'string' ? asJsonOrYaml(result.content, true) : false
}

/**
 * Helper method to load a preseed file from the Gitlab API
 *
 * @param {object} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromGitlab(config) {
  const result = await testUrl(
    `${config.gitlab.url || 'https://gitlab.com'}/api/v4/projects/${config.gitlab.project_id}/repository/files/${encodeURIComponent(config.gitlab.file_path)}?ref=${config.gitlab.ref}`,
    {
      ignoreCertificate: config.verify_certificate === false ? true : false,
      timeout: 4500,
      returnAs: 'json',
      headers: config.gitlab.token ? { 'PRIVATE-TOKEN': config.gitlab.token } : undefined,
    }
  )

  return typeof result.content === 'string' ? asJsonOrYaml(result.content, true) : false
}

/**
 * Helper method to load a preseed file from a (local) git repo
 *
 * @param {object} config - The preseed file config
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @return {object} settings - The loaded settings
 */
async function loadPreseedFileFromRepo(config, preseed, gitroot) {
  const chunks = config.slice(4).split('@')
  const repo = chunks[1] ? chunks[1] : Object.keys(preseed.git)[0]
  const content = await readFileFromRepo(repo, chunks[0], gitroot)
  const data = asJsonOrYaml(content)

  return data ? data : false
}

/**
 * Helper method to load a preseed file from a URL
 *
 * @param {object|string} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromUrl(config) {
  const result = await testUrl(typeof config === 'string' ? config : config.url, {
    ignoreCertificate: config.verify_certificate === false ? false : true,
    timeout: 4500,
    returnAs: 'json',
    headers: config.headers ? config.headers : undefined,
  })

  /*
   * Handle YAML or JSON
   */
  return typeof result === 'string' ? asJsonOrYaml(result, false) : result
}

/**
 * Helper method to load a preseed overlay
 *
 * @param {object|string} overlay - The preseed settings for this overlay
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @return {object} settings - The loaded settings
 */
async function loadPreseedOverlay(overlay, preseed, gitroot) {
  if (typeof overlay === 'string') {
    if (fromRepo(overlay)) return await loadPreseedFileFromRepo(overlay, preseed, gitroot)
    const api = fromApi(overlay)
    if (api === 'github')
      return await loadPreseedFileFromGithub({
        github: {
          ...preseed.base.github,
          // Replace the file path, but strip out the '@github' at the end
          file_path: overlay.slice(0, -7),
        },
      })
    if (api === 'gitlab')
      return await loadPreseedFileFromGitlab({
        gitlab: {
          ...preseed.base.gitlab,
          // Replace the file path, but strip out the '@gitlab' at the end
          file_path: overlay.slice(0, -7),
        },
      })
    return await loadPreseedFileFromUrl(overlay)
  }

  if (overlay.github) return await loadPreseedFileFromGithub(overlay)
  if (overlay.gitlab) return await loadPreseedFileFromGitlab(overlay)

  return false
}

/**
 * Helper method to load the preseed overlays
 *
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @param {object} log - A logger instance
 * @return {object} settings - The loaded settings
 */
async function loadPreseedOverlays(preseed, gitroot, log) {
  const overlays = []

  if (!preseed?.overlays) return overlays

  /*
   * Handle string
   */
  if (typeof preseed.overlays === 'string') {
    /*
     * Could still be a glob for a local git repo
     */
    if (fromRepo(preseed.overlays)) {
      const repos = Object.keys(preseed.git || {})
      let repo = fromApi(preseed.overlays)
      if (!repo) repo = repos[0]
      if (!preseed?.git[repo]) {
        log.warn(`Cannot find repo to glob from: ${preseed.overlays}`)
        return false
      }
      const found = await globFromRepo(preseed.overlays.slice(4).split('@')[0], repo, gitroot)
      for (const overlay of found) {
        if (overlay) overlays.push(overlay)
      }
    } else {
      const overlay = await loadPreseedOverlay(preseed.overlays, preseed, gitroot)
      if (overlay) overlays.push(overlay)
    }
  } else if (Array.isArray(preseed.overlays)) {

  /*
   * Handle array
   */
    for (const config of preseed.overlays) {
      const overlay = await loadPreseedOverlay(config, preseed, gitroot)
      if (overlay) overlays.push(overlay)
    }
  }

  return overlays
}

/**
 * Helper method to read a file from a local git repo
 *
 * @param {string} id - The key in the preseed.git object
 * @param {string} path - The (path to the) file to read
 * @param {gitroot} gitroot - Folder under which git repos reside
 * @return {string} content - The file contents
 */
async function readFileFromRepo(id, path, gitroot) {
  return await readFile(`${gitroot}/${sanitizeGitFolder(id)}/${path}`)
}

/**
 * Helper method to sanitize a git folder
 *
 * @param {string} id - The key under preseed.git
 * @return {string} hash - The hashed id
 */
function sanitizeGitFolder(id) {
  return hash(id)
}
