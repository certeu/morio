/*
 * Various helper methods to handle file system access
 */
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

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
  onError, // String to log on error
) => {
  let content, file
  try {
    file = path.resolve(filePath)
    content = await fs.promises.readFile(file, 'utf-8')
  } catch (err) {
    if (onError) console.log(onError)
    else console.log('Failed to read file:', file, err)

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
  onError, // String to log on error
) => {
  let content
  try {
    content = await readFile(filePath, onError)
    content = yaml.load(content)
  } catch (err) {
    console.log('Failed to read/parse YAMLfile:', filePath, err)

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
  data, // The data to write to disk
) => {
  let result, file
  try {
    file = path.resolve(filePath)
    result = await fs.promises.writeFile(file, data)
  } catch (err) {
    console.log('Failed to write file:', file, err)

    return false
  }

  return true
}

