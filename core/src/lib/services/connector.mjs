import { readYamlFile, readDirectory, writeFile, writeYamlFile, chown, mkdir, rm } from '#shared/fs'
import { extname, basename } from 'node:path'
// Default hooks
import { defaultRecreateContainerHook, defaultRestartContainerHook } from './index.mjs'
// Store
import { store } from '../store.mjs'

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
      if (store.config?.connector?.pipelines) {
        if (
          Object.values(store.config.connector.pipelines).filter((pipe) => !pipe.disabled).length >
          0
        )
          return true
      }

      return false
    },
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreateContainer: (...params) => defaultRecreateContainerHook('connector', ...params),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: (...params) => defaultRestartContainerHook('connector', ...params),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the logstash.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    preCreate: async () => {
      /*
       * See if logstash.yml on the host OS is present
       */
      const file = '/etc/morio/connector/config/logstash.yml'
      const config = await readYamlFile(file)
      if (config && false === 'fixme') {
        store.log.debug('Connector: Config file exists, no action needed')
      } else {
        store.log.debug('Connector: Creating config file')
        await writeYamlFile(file, store.config.services.connector.logstash, store.log, 0o644)
      }

      /*
       * Make sure the data directory exists, and is writable
       */
      const uid = store.getPreset('MORIO_CONNECTOR_UID')
      await mkdir('/morio/data/connector')
      await chown('/morio/data/connector', uid, uid)

      /*
       * Make sure the pipelines directory exists, and is writable
       */
      await mkdir('/etc/morio/connector/pipelines')
      await chown('/etc/morio/connector/pipelines', uid, uid)

      return true
    },
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     */
    preStart: async () => {
      /*
       * Need to write out pipelines, but also remove any that
       * may no longer be there, so we first need to load all
       * pipelines that are on disk
       */
      const currentPipelines = await loadPipelinesFromDisk()
      const wantedPipelines = (Object.keys(store.settings.connector?.pipelines) || []).filter(
        (id) => {
          if (!store.settings?.connector?.pipelines?.[id]) return false
          if (store.settings?.connector?.pipelines?.[id].disabled) return false
          return true
        }
      )

      await createWantedPipelines(wantedPipelines)
      await removeUnwantedPipelines(currentPipelines, wantedPipelines)

      return true
    },
  },
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
    const config = generatePipelineConfiguration(store.settings.connector.pipelines[id], id)
    if (config) {
      const file = pipelineFilename(id)
      await writeFile(`/etc/morio/connector/pipelines/${file}`, config, store.log)
      store.log.debug(`Created connector pipeline ${id}`)
      pipelines.push({
        'pipeline.id': id,
        'path.config': `/usr/share/logstash/pipeline/${file}`,
      })
    }
  }
  await writeYamlFile(`/etc/morio/connector/config/pipelines.yml`, pipelines, store.log)
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
      store.log.debug(`Removing pipeline: ${id}`)
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
  const input = store.settings.connector?.inputs?.[pipeline.input.id] || false
  const output = store.settings.connector?.outputs?.[pipeline.output.id] || false

  if (!input || !output) return false

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
 * The base logstash configuration prepopulated with the local morio output
 */
const logstash = {
  input: {},
  output: {
    morio_local: (xput, pipeline, pipelineId) => `
# Output data to the local Morio deployment
output {
  kafka {
    codec => json
    topic_id => "${pipeline.output.topic}"
    bootstrap_servers => "${store.settings.deployment.nodes.map((node, i) => `broker_${Number(i) + 1}:9092`).join(',')}"
    client_id => "morio_connector"
    id => "${pipelineId}_${xput.id}"
  }
}
`,
  },
}
