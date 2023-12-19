import { docker, runDockerApiCommand, runDockerCliCommand } from '../lib/docker.mjs'
import { validate } from '../lib/validation.mjs'
import { schemaViolation, dockerError } from '../lib/response.mjs'

/**
 * This docker controller handles low-level docker tasks
 *
 * @returns {object} Controller - The docker controller object
 */
export function Controller() {}

/**
 * Docker API GET commands
 *
 * This just passes through the command to the Docker API
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any command options
 */
Controller.prototype.dockerGetCmd = async (req, res, cmd, options = {}) => {
  /*
   * Map API path to Docker command
   */
  const commands = {
    containers: 'listContainers',
    'running-containers': 'listContainers',
    'all-containers': 'listContainers',
    images: 'listImages',
    services: 'listServices',
    nodes: 'listNodes',
    tasks: 'listTasks',
    secrets: 'listSecrets',
    configs: 'listConfigs',
    plugins: 'listPlugins',
    volumes: 'listVolumes',
    networks: 'listNetworks',
    info: 'info',
    version: 'version',
    df: 'df',
  }

  /*
   * Ensure it's a valid command for this type of request
   */
  if (typeof commands[req.params.cmd] === 'undefined') return res.status(404).send()

  /*
   * Validate request against schema
   * Since we're only validating the command, the above covers the same
   * However, the above handles all commands, whereas the schema checks
   * the list of commands allowed vs a value that can be set in an
   * environment variable, allowing people to furhter lock this down.
   */
  const [valid, err] = await validate('docker.getCommand', req.params)
  if (!valid) return schemaViolation(err, res)

  const [success, result] = await runDockerApiCommand(commands[valid.cmd], options)

  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Docker API POST commands
 *
 * This just passes through the command to the Docker API
 * using the request body as the command options.
 * Validation of the request body is left to the Docker client.
 *
 * It handles all commands that operate on the root Docker object
 * and that do something that require a POST
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any command options
 */
Controller.prototype.dockerPostCmd = async (req, res, cmd) => {
  /*
   * Map API path to Docker command
   */
  const commands = {
    container: 'createContainer',
  }

  /*
   * Ensure it's a valid command for this type of request
   */
  if (typeof commands[req.params.cmd] === 'undefined') return res.status(404).send()

  /*
   * Validate request against schema
   * Since we're only validating the command, the above covers the same
   * However, the above handles all commands, whereas the schema checks
   * the list of commands allowed vs a value that can be set in an
   * environment variable, allowing people to furhter lock this down.
   */
  const [valid, err] = await validate('docker.postCommand', req.params)
  if (!valid) return schemaViolation(err, res)

  const [success, result] = await runDockerApiCommand(commands[valid.cmd], req.body)

  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Docker pull - Behaves like the CLI
 *
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.pull = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('docker.pull', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Running the docker CLI command
   */
  const stream = await docker.pull(valid.tag)

  /*
   * Set up streaming response
   */
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  /*
   * Push out chunks as they come in
   */
  stream.on('data', (chunk) => {
    res.write(chunk)
    //let data
    //try {
    //  data = JSON.parse(chunk.toString())
    //}
    //catch (err) {
    //  console.log(err)
    //}
    //console.log(data)
    //res.write(JSON.stringify(data))
  })

  /*
   * Close the response when the stream is complete
   */
  stream.on('end', () => {
    return res.end()
  })

  //  => {
  //  console.log('in callback', {err, a, b, c})
  //  return res.send()
  //})
  //   .then(data => {
  //   console.log('in then', data)
  // }).catch(err => {
  //   console.log('in catch', err)
  // })
}
