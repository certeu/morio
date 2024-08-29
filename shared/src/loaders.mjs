import axios from 'axios'
import { testUrl } from './network.mjs'
import set from 'lodash.set'
import yaml from 'js-yaml'

/*
 * A collection of utils to load various files
 * Typially used to load the preseeded config
 */

/**
 * Helper method to resolve credentials for a preseed request
 */
//const resolvePreseedCredentials = (config, utils) => {
//}

/**
 * Helper method to parse a result as YAML or JSON
 */
const asYamlOrJson = (input, base64=false) => {
  const data = base64
    ? Buffer.from(input, 'base64').toString('utf-8')
    : input
  try {
    const yml = yaml.load(data)
    if (yml) return yml
  }
  catch (err) {
    // So it's not yaml
  }
  try {
    const json = JSON.parse(data)
    if (json) return json
  }
  catch (err) {
    // So it's not json either?
  }

  return false
}

/**
 * Helper method to load a preseed file from a URL
 *
 * @param {object} config - The preseed config
 * @param {object} utils - The utils object
 * @return {object} config - The loaded config
 */
export const loadPreseedFileFromUrl = async (config, utils) => {
  const result = await testUrl(config.url, {
    ignoreCertificate: config.verify_certificate === false ? false : true,
    timeout: 4500,
    returnAs: 'json',
    headers: config.headers ? config.headers : undefined
  })

  /*
   * Handle YAML
   */
  return typeof result === 'string'
    ? asYamlOrJson(result, false)
    : result
}

/**
 * Helper method to load a preseed file from the Gitlab API
 *
 * @param {object} config - The preseed config
 * @param {object} utils - The utils object
 * @return {object} config - The loaded config
 */
export const loadPreseedFileFromGitlab = async (config, utils) => {
  const result = await testUrl(
    `${config.gitlab.url}/api/v4/projects/${config.gitlab.project_id}/repository/files/${encodeURIComponent(config.gitlab.file_path)}?ref=${config.gitlab.ref}`,
    {
      ignoreCertificate: config.verify_certificate === false ? true : false,
      timeout: 4500,
      returnAs: 'json',
      headers: config.gitlab.token
        ? { 'PRIVATE-TOKEN': config.gitlab.token }
        : undefined
  })

  return typeof result.content === 'string'
    ? asYamlOrJson(result.content, true)
    : false
}

/**
 * Helper method to load a preseed file from the Github API
 *
 * @param {object} config - The preseed config
 * @param {object} utils - The utils object
 * @return {object} config - The loaded config
 */
export const loadPreseedFileFromGithub = async (config, utils) => {
  const result = await testUrl(
    `${config.github.url || 'https://api.github.com'}/repos/${config.github.owner}/${config.github.repo}/contents/${encodeURIComponent(config.github.file_path)}?ref=${config.github.ref}`,
    {
      returnError: true,
      ignoreCertificate: config.verify_certificate === false ? true : false,
      timeout: 4500,
      returnAs: 'json',
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: config.github.token
          ? `Bearer ${config.github.token}`
          : undefined
      }
  })

  return typeof result.content === 'string'
    ? asYamlOrJson(result.content, true)
    : false
}

/**
 * Helper method to load a preseed file
 *
 * @param {object} preseed - The preseed file config
 * @param {object} utils - The utils object
 * @return {object} config - The loaded config
 */
export const loadPreseedFile = async (config={}, utils) => {
  if (config.url) return await loadPreseedFileFromUrl(config, utils)
  if (config.gitlab) return await loadPreseedFileFromGitlab(config, utils)
  if (config.github) return await loadPreseedFileFromGithub(config, utils)

  return false
}

/**
 * Helper method to load a preseeded configuration
 *
 * @param {object} preseed - The preseed config
 * @param {object} utils - The utils object
 * @param {object} log - A logger instance
 * @return {object} config - The loaded config
 */
export const loadPreseededConfig = async (preseed, utils, log) => {
  /*
   * Attempt to load the preseed base file
   */
  const config = await loadPreseedFile(preseed.base, utils)
  if (!config) {
    log.warn(`Failed to load preseed base file`)
    return false
  }
  else log.debug(`Loaded preseed base file`)

  /*
   * Handle any preseed overlays
   */
  if (Array.isArray(preseed.overlays) && preseed.overlays.length > 0) {
    const count = preseed.overlays.length
    log.debug(`Need to load ${count} preseed overlays`)
    let i = 0
    for (const overlay of preseed.overlays) {
      i++
      const overlayConfig = await loadPreseedFile(overlay)
      if (!overlayConfig) {
        /*
         * We _could_ continue if an overlay cannot be loaded
         * but doing so would result in a non-deterministic config.
         * Better to bail and make it clear something is wrong.
         */
        log.debug(`Failed to load preseed overlay ${i}/${count}. Cannot load preseeded configuration.`)
        return false
      }
      else {
        log.debug(`Loaded preseed overlay ${i}/${count}`)
        for (const [path, value] of Object.entries(overlayConfig)) {
          set(config, path, value)
        }
      }
    }
  }

  return config
}

