import pkg from '../package.json' assert { type: 'json' }
import { defaults } from '#defaults'
import { randomString } from '#shared/crypto'
import { readYamlFile, readBsonFile, readDirectory } from '#shared/fs'
import { logger } from '#shared/logger'
import { fromEnv } from '#shared/env'
import { runDockerApiCommand } from '#lib/docker'

/**
 * Generates/Loads the configuration, starts Swarm and services
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapSam = async () => {
  /*
   * First setup the logger, so we can log
   */
  const log = logger(fromEnv('MORIO_LOG_LEVEL_SAM'), pkg.name)

  /*
   * Find out what configuration exists on disk
   */
  const timestamps = ((await readDirectory(fromEnv('MORIO_SAM_CONFIG_FOLDER'))) || [])
    .filter((file) => new RegExp('morio.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()

  /*
   * Compile a list of configurations
   */
  const configs = {}
  let i = 0
  const dir = fromEnv('MORIO_SAM_CONFIG_FOLDER')
  let current = false
  for (const timestamp of timestamps) {
    const config = await readYamlFile(`${dir}/morio.${timestamp}.yaml`)
    configs[timestamp] = {
      comment: config.comment || 'No message provided',
      current: false,
    }
    if (i === 0) {
      current = timestamp
      const keys = await readBsonFile(`${dir}/.${timestamp}.keys`)
      configs.current = { config, keys }
      configs[timestamp].current = true
    }
  }

  /*
   * Has MORIO been setup?
   * If so, we should have a current config
   */
  if (configs.current) {
    log.info('Configuration file loaded')
    if (configs.current.config.morio.nodes.length > 1) {
      log.info(
        `This Morio instance is part of a ${configs.current.config.morio.nodes.length}-node cluster`
      )
    } else {
      log.info(`This Morio instance is a solitary node`)
      log.info(
        `We are ${configs.current.config.morio.nodes[0]} (${configs.current.config.morio.display_name})`
      )
    }
  } else {
    log.info(
      'Morio is not depoyed (yet) - Starting API with an ephemeral configuration to allow setup'
    )
  }

  /*
   * Start containers
   */
  if (configs.current) {
    await startSwarm(configs.current)
  }

  const data = {
    configs,
    running_config: current,
    about: pkg.description,
    name: pkg.name,
    start_time: Date.now(),
    version: pkg.version,
    defaults,
    log,
  }
  if (configs.current) {
    data.config = configs.current.config
    data.keys = configs.current.keys
    delete data.configs.current
  }

  return data
}

const startSwarm = async (config) => {
  const [success, result] = await runDockerApiCommand('swarmInspect')
  //if (!success) {
  //  if (result.includes('node a swarm manager')) {
  //    /*
  //     * Initialize swarm
  //     */
  //  //const [success, result] = await runDockerApiCommand('swarmInit', {
  //  //  ListenAddr: 'fixme'
  //  //})
  //    }
  //}

  console.log({ success, result })
}
