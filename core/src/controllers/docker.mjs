import {
  docker,
  runDockerApiCommand,
  runContainerApiCommand,
  runContainerImageApiCommand,
  runNetworkApiCommand,
} from '#lib/docker'
import { validate } from '#lib/validation'
import { schemaViolation, dockerError } from '#lib/response'
import { cloneAsPojo } from '#shared/utils'

/**
 * This docker controller handles low-level docker tasks
 *
 * @returns {object} Controller - The docker controller object
 */
export function Controller() {}

/**
 * Gets data Docker an returns it
 *
 * This handles the following commands on the docker object:
 *   - listContainers
 *   - listImages
 *   - listServices
 *   - listNodes
 *   - listTasts
 *   - listSecrets
 *   - listConfigs
 *   - listPlugins
 *   - listVolumes
 *   - listNetworks
 *   - info
 *   - version
 *   - df
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any options to pass to the command
 */
Controller.prototype.getDockerData = async (req, res, cmd = 'inspect', options = {}) => {
  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runDockerApiCommand(cmd, options)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Gets data from a Docker container an returns it
 *
 * This handles the following commands on a Container object:
 *   - inspect
 *   - logs (non-streaming)
 *   - stats (non-streaming)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Options to pass to the container API
 */
Controller.prototype.getContainerData = async (req, res, cmd = 'inspect', options = {}) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.container.${cmd}`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the container API command
   */
  const [success, result] = await runContainerApiCommand(valid.id, cmd, options)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Creates a Docker resource
 *
 * This handles the following commands on the docker object:
 *   -  createContainer
 *   -  createSecret
 *   -  createConfig
 *   -  createPlugin
 *   -  createVolume
 *   -  createService
 *   -  createNetwork
 *   -  createImage
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createResource = async (req, res, cmd) => {
  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runDockerApiCommand(cmd, req.body)

  /*
   * Return result
   */
  return success ? res.status(201).send(cloneAsPojo(result)) : dockerError(result, res)
}

/**
 * Removes a Docker network
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.removeNetwork = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.network.remove`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runNetworkApiCommand(valid.id, 'remove')

  /*
   * Return result
   */
  return success ? res.status(204).send(cloneAsPojo(result)) : dockerError(result, res)
}

/**
 * Updates a container resource
 *
 * This handles the following commands on the docker object:
 *   -  kill
 *   -  pause
 *   -  restart
 *   -  start
 *   -  stop
 *   -  unpause
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateContainer = async (req, res, cmd) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.container.inspect`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the container command
   */
  const [success, result] = await runContainerApiCommand(valid.id, cmd)

  /*
   * Return result
   */
  return success ? res.status(204).send() : dockerError(result, res)
}

/**
 * Gets data from a Docker container image and returns it
 *
 * This handles the following commands on a Container image object:
 *   - inspect
 *   - history
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.getImageData = async (req, res, cmd = 'inspect') => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.image.inspect`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the container image API command
   */
  const [success, result] = await runContainerImageApiCommand(valid.id, cmd)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Gets data from a Docker network and returns it
 *
 * This handles the following commands on a Container image object:
 *   - inspect
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.getNetworkData = async (req, res, cmd = 'inspect') => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.network.${cmd}`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the docker network API command
   */
  const [success, result] = await runNetworkApiCommand(valid.id, cmd)

  /*
   * Return result
   */
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
 * @param {object} options - Any command options
 */
Controller.prototype.dockerPostCmd = async (req, res) => {
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
