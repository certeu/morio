/*
 * Various helper methods to handle file system access
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

/**
 * The morio root folder
 */
export const root = path.resolve(path.basename(import.meta.url), '..')

/**
 * Reads a file from disk
 *
 * @param {string} (relative) path to the file to read
 * @param {string} onError - a string to log on error rather than the default
 *
 * @return {string} File contents, or false in case of trouble
 */
export const readFile = async (
  filePath, // The (relative) path to the file
  onError // Method to run on error
) => {
  let content, file
  try {
    file = path.resolve(root, filePath)
    content = await fs.promises.readFile(file, 'utf-8')
  } catch (err) {
    if (onError) onError(err)

    return false
  }
  return content
}

/**
 * Reads a YAML file from disk and parses it
 *
 * @param {string} path - (relative) path to the file to read
 * @param {string} onError - a string to log on error rather than the default
 *
 * @return {string} File contents, or false in case of trouble
 */
export const readYamlFile = async (
  filePath, // The (relative) path to the file
  onError // Method to run on error
) => {
  let content
  try {
    content = await readFile(filePath, onError)
    content = yaml.load(content)
  } catch (err) {
    if (onError) onError(err)

    return false
  }

  return content
}

/**
 * Writes a file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk
 *
 * @return {bool} true of success, false in case of trouble
 */
export const writeFile = async (
  filePath, // The (relative) path to the file
  data // The data to write to disk
) => {
  let result, file
  try {
    file = path.resolve(root, filePath)
    result = await fs.promises.writeFile(file, data)
  } catch (err) {
    log.warn(err, `Failed to write file: ${file}`)

    return false
  }

  return true
}

/**
 * Writes a YAML file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk as a Javascript object
 *
 * @return {bool} true of success, false in case of trouble
 */
export const writeYamlFile = async (filePath, data) => await writeFile(filePath, yaml.dump(data))
