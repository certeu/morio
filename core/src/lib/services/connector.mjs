import { readDirectory, writeFile, writeYamlFile, chown, mkdir, rm } from '#shared/fs'
import { extname, basename } from 'node:path'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'connector',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     *
     * For the connector, the answer is only true when there are pipelines configured
     *
     * @return {boolean} wanted - Wanted or not
     */
    wanted: async () => {
      const pipelines = utils.getSettings('connector.pipelines', false)

      return (pipelines && Object.values(pipelines).filter((pipe) => !pipe.disabled).length > 0)
        ? true
        : false
    },
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: (hookParams) => defaultRecreateServiceHook('connector', hookParams),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('connector', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the logstash.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    precreate: ensureLocalPrerequisites,
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the logstash.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    predefer: ensureLocalPrerequisites,
    prestart: async () => {
      /*
       * Need to write out pipelines, but also remove any that
       * may no longer be there, so we first need to load all
       * pipelines that are on disk
       */
      const currentPipelines = await loadPipelinesFromDisk()
      const wantedPipelines = Object.keys(utils.getSettings('connector.pipelines', {})).filter(
        (id) => {
          if (!utils.getSettings(['connector', 'pipelines', id], false)) return false
          if (utils.getSettings(['connector', 'pipelines', id, 'disabled'], false)) return false
          return true
        }
      )

      await createWantedPipelines(wantedPipelines)
      await removeUnwantedPipelines(currentPipelines, wantedPipelines)

      return true
    },
  },
}

async function ensureLocalPrerequisites() {
  /*
   * Write out logstash.yml based on the settings
   */
  const file = '/etc/morio/connector/logstash.yml'
  log.debug('Connector: Creating config file')
  await writeYamlFile(file, utils.getMorioServiceConfig('connector').logstash, log, 0o644)

  /*
   * Make sure the data directory exists, and is writable
   */
  const uid = utils.getPreset('MORIO_CONNECTOR_UID')
  await mkdir('/morio/data/connector')
  await chown('/morio/data/connector', uid, uid)

  /*
   * Make sure the pipelines directory exists, and is writable
   */
  await mkdir('/etc/morio/connector/pipelines')
  await chown('/etc/morio/connector/pipelines', uid, uid)

  /*
   * Make sure pipelines.yml file exists, so it can be mounted
   */
  await writeYamlFile('/etc/morio/connector/pipelines.yml', {}, log, 0o644)

  return true
}

/**
 * Helper method to load a list of all pipeline configurations from disk
 *
 * @return {Array} list - A list of filenames
 */
const loadPipelinesFromDisk = async () =>
  ((await readDirectory(`/etc/morio/connector/pipelines`)) || [])
    .filter((file) => extname(file) === '.config')
    .map((file) => basename(file).slice(0, -7))
    .sort()

/**
 * Helper method to generate the pipeline configuration filename
 *
 * @return {string} filename - The filename for the configuration
 */
const pipelineFilename = (id) => `${id}.config`

/*
 * Helper method to create the pipelines wanted by the user
 *
 * @param {Array} wantedPipelines - List of pipelines wanted by the user
 */
const createWantedPipelines = async (wantedPipelines) => {
  const pipelines = []
  for (const id of wantedPipelines) {
    const config = generatePipelineConfiguration(utils.getSettings(['connector', 'pipelines', id]), id)
    if (config) {
      const file = pipelineFilename(id)
      await writeFile(`/etc/morio/connector/pipelines/${file}`, config, log)
      log.debug(`Created connector pipeline ${id}`)
      pipelines.push({
        'pipeline.id': id,
        'path.config': `/usr/share/logstash/config/pipeline/${file}`,
      })
    }
  }
  await writeYamlFile(`/etc/morio/connector/pipelines.yml`, pipelines, log)
}

/**
 * Helper method to remove pipeline configurations files from disk
 *
 * When you create a pipeline, and then remove it later, this will
 * garbage-collect its configuration file
 *
 * @param {Array} currentPipelines - List of pipelines currently on disk
 * @param {Array} wantedPipelines - List of pipelines wanted by the user
 */
const removeUnwantedPipelines = async (currentPipelines, wantedPipelines) => {
  for (const id of currentPipelines) {
    if (!wantedPipelines.includes(id)) {
      log.debug(`Removing pipeline: ${id}`)
      await rm(`/etc/morio/connector/pipelines/${id}.config`)
    }
  }
}

/**
 * Helper method to generate a Logstash pipeline configuration
 *
 * @param {object} pipeline - The pipeline configuration
 * @param {string} pipelineId - The pipeline ID
 * @return {string} config - The generated pipeline configuration
 */
const generatePipelineConfiguration = (pipeline, pipelineId) => {
  const input = utils.getSettings(['connector', 'inputs', pipeline.input.id], false)
  if (!input) return false
  const output = utils.getSettings(['connector', 'outputs', pipeline.output.id], false)
  if (!output) return false

  return `# This pipeline configuration is auto-generated by Morio core
# Any changes you make to this file will be overwritten
${generateXputConfig(input, pipeline, pipelineId, 'input')}
${generateXputConfig(output, pipeline, pipelineId, 'output')}
`
}

/**
 * Gets the Logstash plugin name based on the pipeline plugin
 *
 * Most of the time, the plugin name used by morio is the same as the Logstash
 * plugin name. For example, rss is rss, imap is imap, and so on.
 * But for some, there is a difference. Specifically morio_local and
 * morio_remote which both use the kafka logstash plugin under the hood
 *
 * @param {string} plugin - The morip connector plugin name
 * @return {string} logStashplugin - The Logstash plugin name
 */
const morioPluginAsLogstashPluginName = (plugin) =>
  ['morio_local', 'morio_remote'].includes(plugin) ? 'kafka' : plugin

/**
 * Generates an input or output (xput) configuration for Logstash
 *
 * @param {object} xput - the xput configuration
 * @param {object} pipeline - the pipeline configuration
 * @param {string} pipelineId - the pipeline ID
 * @param {string} type - One of input our output
 * @return {string} config - the xput configuration
 */
const generateXputConfig = (xput, pipeline, pipelineId, type) =>
  logstash[type]?.[xput.plugin]
    ? logstash[type][xput.plugin](xput, pipeline, pipelineId)
    : `
# ${type === 'input' ? 'Input' : 'Output'}, aka where to ${type === 'input' ? 'read data from' : 'write data to'}
${type} {
  ${morioPluginAsLogstashPluginName(xput.plugin)} { ${generatePipelinePluginConfig(xput.plugin, xput, pipeline, pipelineId, type)}  }
}

`
/**
 * Generates a pipeline plugin configuration for Logstash
 *
 * @param {string} plugin - the morio plugin name
 * @param {object} xput - the xput configuration
 * @param {object} pipeline - the pipeline configuration
 * @param {string} pipelineId - the pipeline ID
 * @param {string} type - one of 'input' or 'output'
 * @return {string} config - the xput configuration
 */
const generatePipelinePluginConfig = (plugin, xput, pipeline, pipelineId, type) => {
  let config = ''
  for (const [key, val] of Object.entries(xput)) {
    if (!['id', 'type', 'plugin', 'about'].includes(key)) {
      config += `\n    ${key} => ${JSON.stringify(val)}`
    }
    if (key === 'id') config += `\n    ${key} => ${JSON.stringify(pipelineId + '_' + val)}`
  }

  if (pipeline && type === 'output') {
    if (plugin === 'morio_local') {
      config += `\n    topic => ${JSON.stringify(pipeline.output.topic)}`
    }
  }

  return config + '\n'
}

/*
 * These are the various methods to take Morio settings
 * and turn it into a Logstash input or output configuration
 * for a Logstash pipeline
 */
const logstash = {
  input: {
    /*
     * Local morio input, essentially Kafka
     */
    morio_local: (xput, pipeline, pipelineId) => `
# Read data from a local Morio broker
input {
  kafka {
    codec => json
    topics => ["${pipeline.input.topic}"]
    bootstrap_servers => "${utils.getSettings('deployment.nodes').map((node, i) => `broker_${Number(i) + 1}:9092`).join(',')}"
    client_id => "morio_connector_input"
    id => "${pipelineId}_${xput.id}"
  }
}
`,
  },
  output: {
    /*
     * Elasticsearch output
     */
    //data_stream => ${pipeline.output.index_type === 'docs' ? "false" : "true"}
    //data_stream_auto_routing => false
    elasticsearch: (xput, pipeline) => {
      let config = `
# Output data to Elasticsearch
output {
  elasticsearch {
    action => "create"
    compression_level => ${xput.compression_level}
    ecs_compatibility => "${['disabled', 'v1', 'v8'].includes(pipeline.output?.enforce_ecs) ? pipeline.output.enforce_ecs : 'v8'}"
    index => "${pipeline.output.index}"
    api_key => "${xput.api_key}"`
      if (xput.environment === 'cloud')
        config += `
    cloud_id => "${xput.cloud_id}"`
      else
        config += `
    # FIXME: Handle non-cloud settings`

      return (
        config +
        `
  }
}
`
      )
    },
    /*
     * Local morio output, essentially Kafka
     */
    morio_local: (xput, pipeline, pipelineId) => `
# Output data to a local Morio broker
output {
  kafka {
    codec => json
    topic_id => "${pipeline.output.topic}"
    bootstrap_servers => "${utils.getSettings('deployment.nodes').map((node, i) => `broker_${Number(i) + 1}:9092`).join(',')}"
    client_id => "morio_connector_output"
    id => "${pipelineId}_${xput.id}"
  }
}
`,
  },
}
