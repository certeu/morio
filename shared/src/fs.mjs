/*
 * Various helper methods to handle file system access
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { glob } from 'glob'

/**
 * The morio root folder
 */
export const root = path.resolve(path.basename(import.meta.url), '..')

/**
 * Chonges ownership of a file or folder
 *
 * Note that this wraps the chown system call which has no recusion
 *
 * @param {string} target - (relative) path to the file or folder
 * @param {number} uid - User id
 * @param {number} gid - Group id
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function chown(
  target, // The (relative) path to the folder to create
  uid, // The user ID
  gid, // The group ID
  onError // Method to run on error
) {
  try {
    await fs.promises.chown(path.resolve(root, target), uid, gid)
  } catch (err) {
    if (onError) onError(err)
    else console.log(err)

    return false
  }

  return true
}

/**
 * Copies a file
 *
 * @param {string} src - Source file
 * @param {string} dst - Destination file
 * @param {object} options - Options for the fs.cp call in NodeJS
 *
 */
export async function cp(src, dst, options = {}) {
  try {
    await fs.promises.cp(path.resolve(root, src), path.resolve(root, dst), options)
  } catch (err) {
    return false
  }

  return true
}

/**
 * Removes a file
 *
 * @param {string} file - Path to the file to remove
 * @param {object} options - Options for NodeJS' rm method
 *
 */
export async function rm(file, options = { force: true }) {
  try {
    await fs.promises.rm(path.resolve(root, file), options)
  } catch (err) {
    return false
  }

  return true
}

/**
 * Reads a folder from disk with an optional glob pattern
 *
 * @param {string} (relative) path to the file to read
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function globDir(
  folderPath = '/morio/downloads', // The (relative) path to the folder
  pattern = '**/*' // Glob pattern to match
) {
  let list = []
  try {
    list = await glob(path.resolve(folderPath) + '/' + pattern)
  } catch (err) {
    if (err) console.log(err)
    return false
  }

  return list
}

/**
 * Creates a directory/folder
 *
 * @param {string} dirPath - (relative) path to the folder to create
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function mkdir(
  dirPath, // The (relative) path to the folder to create
  onError // Method to run on error
) {
  let dir
  try {
    dir = path.resolve(root, dirPath)
    await fs.promises.mkdir(dir)
  } catch (err) {
    if (onError) onError(err)

    return false
  }
  return true
}

/**
 * Reads a file from disk
 *
 * @param {string} (relative) path to the file to read
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function readFile(
  filePath, // The (relative) path to the file
  onError, // Method to run on error
  binary = false
) {
  let content, file
  try {
    file = path.resolve(root, filePath)
    content = await fs.promises.readFile(file, binary ? undefined : 'utf-8')
  } catch (err) {
    if (onError) onError(err)

    return false
  }
  return content
}

/**
 * Reads a JSON file from disk and parses it
 *
 * @param {string} path - (relative) path to the file to read
 * @param {string} onError - a string to log on error rather than the default
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function readJsonFile(
  filePath, // The (relative) path to the file
  onError // Method to run on error
) {
  let content
  try {
    content = await readFile(filePath, onError, true)
    content = JSON.parse(content)
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
export async function readYamlFile(
  filePath, // The (relative) path to the file
  onError // Method to run on error
) {
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
 * @param {function} log - a logger instance (or false)
 * @param {octal} mode - a mode for chmod
 *
 * @return {bool} true of success, false in case of trouble
 */
export async function writeFile(
  filePath, // The (relative) path to the file
  data, // The data to write to disk
  log = false,
  mode = 0o666
) {
  let file
  try {
    file = path.resolve(root, filePath)
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await fs.promises.writeFile(file, data)
    await fs.promises.chmod(file, mode)
  } catch (err) {
    if (log) log.warn(err, `Failed to write file: ${file}`)
    else console.log(`Failed to write file: ${file}`)

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
export async function writeYamlFile(filePath, data, log = false, mode = 0o666) {
  return await writeFile(filePath, yaml.dump(data), log, mode)
}

/**
 * Writes a JSON file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk as a Javascript object
 *
 * @return {bool} true of success, false in case of trouble
 */
export async function writeJsonFile(filePath, data, log, mode) {
  return await writeFile(filePath, JSON.stringify(data, null, 2), log, mode)
}

/**
 * Reads the contents of a directory (non-recursive)
 *
 * @param {string} dirPath - (relative) path to the directory to read
 * @param {funtion} onError - a method to call on error
 */
export async function readDirectory(dirPath, onError) {
  let files
  try {
    const dir = path.resolve(root, dirPath)
    files = await fs.promises.readdir(dir)
  } catch (err) {
    if (onError) onError(err)

    return false
  }

  return files
}
