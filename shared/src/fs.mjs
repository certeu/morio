/*
 * Various helper methods to handle file system access
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { BSON } from 'bson'
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
export const chown = async (
  target, // The (relative) path to the folder to create
  uid, // The user ID
  gid, // The group ID
  onError // Method to run on error
) => {
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
 *
 */
export const cp = async (src, dst) => {
  try {
    await fs.promises.cp(path.resolve(root, src), path.resolve(root, dst))
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
export const globDir = async (
  folderPath='/morio/tmp_static', // The (relative) path to the folder
  pattern='**/*', // Glob pattern to match
) => {
  let list = []
  try {
    list = await glob(path.resolve(folderPath)+'/'+pattern)
  }
  catch (err) {
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
export const mkdir = async (
  dirPath, // The (relative) path to the folder to create
  onError // Method to run on error
) => {
  let dir
  try {
    dir = path.resolve(root, dirPath)
    await fs.promises.mkdir(dir, { recursive: true })
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
export const readFile = async (
  filePath, // The (relative) path to the file
  onError, // Method to run on error
  binary = false
) => {
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
 * Reads a BSON file from disk and parses it
 *
 * @param {string} path - (relative) path to the file to read
 * @param {string} onError - a string to log on error rather than the default
 *
 * @return {string} File contents, or false in case of trouble
 */
export const readBsonFile = async (
  filePath, // The (relative) path to the file
  onError // Method to run on error
) => {
  let content
  try {
    content = await readFile(filePath, onError, true)
    content = BSON.deserialize(content)
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
export const readJsonFile = async (
  filePath, // The (relative) path to the file
  onError // Method to run on error
) => {
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
 * @param {functino} log - a logger instance (or false)
 *
 * @return {bool} true of success, false in case of trouble
 */
export const writeFile = async (
  filePath, // The (relative) path to the file
  data, // The data to write to disk
  log = false,
  mode = 0o666,
) => {
  let file
  try {
    file = path.resolve(root, filePath)
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await fs.promises.writeFile(file, data, { mode })
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
export const writeYamlFile = async (filePath, data) => await writeFile(filePath, yaml.dump(data))

/**
 * Writes a BSON file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk as a Javascript object
 *
 * @return {bool} true of success, false in case of trouble
 */
export const writeBsonFile = async (filePath, data) =>
  await writeFile(filePath, BSON.serialize(data))

/**
 * Reads the contents of a directory (non-recursive)
 *
 * @param {string} dirPath - (relative) path to the directory to read
 * @param {funtion} onError - a method to call on error
 */
export const readDirectory = async (dirPath, onError) => {
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
