import { readDirectory, writeFile, writeYamlFile, chown, mkdir, rm } from '#shared/fs'
import { createP12Keystore, convertPkcs1ToPkcs8 } from '#shared/crypto'
import { extname, basename } from 'node:path'
import { ensureServiceCertificate } from '#lib/tls'
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

      return pipelines && Object.values(pipelines).filter((pipe) => !pipe.disabled).length > 0
        ? true
        : false
    },
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => true, //defaultRecreateServiceHook('connector'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => true, //defaultRestartServiceHook('connector', hookParams),
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

const nl = '\n'

async function ensureLocalPrerequisites() {
  /*
   * Write out logstash.yml based on the settings
   */
  const config = utils.getMorioServiceConfig('connector', false)
  if (config) {
    const file = '/etc/morio/connector/logstash.yml'
    log.debug('Connector: Creating config file')
    await writeYamlFile(file, config.logstash, log, 0o644)
  }

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
   * Make sure the pipeline_assets directory exists, and is writable
   */
  await mkdir('/etc/morio/connector/pipeline_assets')
  await chown('/etc/morio/connector/pipeline_assets', uid, uid)

  /*
   * Make sure pipelines.yml file exists, so it can be mounted
   */
  await writeYamlFile('/etc/morio/connector/pipelines.yml', {}, log, 0o644)

  /*
   * Make sure we have a keystore on disk to connect to Kafka
   */
  const x509 = await ensureServiceCertificate('connector', true)
  const caCerts = [utils.getCaConfig().intermediate, utils.getCaConfig().certificate]
  const keystore = '/etc/morio/connector/pipeline_assets/local-keystore.pem'
  await writeFile(keystore, convertPkcs1ToPkcs8(x509.key) + x509.cert + utils.getCaConfig().intermediate , log, 0o600)
  await chown(keystore, uid, uid)

  /*
   * Also add a truststore, which is just the CA root PEM
   */
  const truststore = '/etc/morio/connector/pipeline_assets/local-truststore.pem'
  await writeFile(truststore, utils.getCaConfig().certificate , log, 0o644)

  return true
}

/**
 * Helper method to load a list of all pipeline configurations from disk
 *
 * @return {Array} list - A list of filenames
 */
async function loadPipelinesFromDisk() {
  return ((await readDirectory(`/etc/morio/connector/pipelines`)) || [])
    .filter((file) => extname(file) === '.config')
    .map((file) => basename(file).slice(0, -7))
    .sort()
}

/**
 * Helper method to generate the pipeline configuration filename
 *
 * @return {string} filename - The filename for the configuration
 */
function pipelineFilename(id) {
  return `${id}.config`
}

/*
 * Helper method to create the pipelines wanted by the user
 *
 * @param {Array} wantedPipelines - List of pipelines wanted by the user
 */
async function createWantedPipelines(wantedPipelines) {
  const pipelines = []
  for (const id of wantedPipelines) {
    const config = await generatePipelineConfiguration(
      utils.getSettings(['connector', 'pipelines', id]),
      id
    )
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
async function removeUnwantedPipelines(currentPipelines, wantedPipelines) {
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
async function generatePipelineConfiguration(pipeline, pipelineId) {
  const input = utils.getSettings(['connector', 'inputs', pipeline.input.id], false)
  if (!input) return false
  const output = utils.getSettings(['connector', 'outputs', pipeline.output.id], false)
  if (!output) return false

  const inConf = await generateXputConfig(input, pipeline, pipelineId, 'input')
  const outConf = await generateXputConfig(output, pipeline, pipelineId, 'output')

  return `# This pipeline configuration is auto-generated by Morio core
# Any changes you make to this file will be overwritten
${inConf}
${outConf}
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
function morioPluginAsLogstashPluginName(plugin) {
  return ['morio_local', 'morio_remote'].includes(plugin) ? 'kafka' : plugin
}

/**
 * Generates an input or output (xput) configuration for Logstash
 *
 * @param {object} xput - the xput configuration
 * @param {object} pipeline - the pipeline configuration
 * @param {string} pipelineId - the pipeline ID
 * @param {string} type - One of input our output
 * @return {string} config - the xput configuration
 */
async function generateXputConfig(xput, pipeline, pipelineId, type) {
  return logstash[type]?.[xput.plugin]
    ? await logstash[type][xput.plugin](xput, pipeline, pipelineId)
    : `
# ${type === 'input' ? 'Input' : 'Output'}, aka where to ${type === 'input' ? 'read data from' : 'write data to'}
${type} {
  ${morioPluginAsLogstashPluginName(xput.plugin)} { ${generatePipelinePluginConfig(xput.plugin, xput, pipeline, pipelineId, type)}  }
}

`
}

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
function generatePipelinePluginConfig(plugin, xput, pipeline, pipelineId, type) {
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
    codec => "json"
    topics => ["${pipeline.input.topic}"]
    bootstrap_servers => "${utils
      .getBrokerFqdns()
      .map((fqdn) => `${fqdn}:9092`)
      .join(',')}"
    client_id => "morio_connector_input"
    id => "${pipelineId}_${xput.id}"
    security_protocol => "SSL"
    ssl_endpoint_identification_algorithm => ""
    ssl_keystore_location => "/usr/share/logstash/config/pipeline_assets/local-keystore.pem"
    ssl_keystore_type => "PEM"
    ssl_truststore_location => "/usr/share/logstash/config/pipeline_assets/local-truststore.pem"
    ssl_truststore_type => "PEM"
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
    ecs_compatibility => "${['disabled', 'v1', 'v8'].includes(pipeline.output.enforce_ecs) ? pipeline.output.enforce_ecs : 'v8'}"
    index => "${pipeline.output.index}"
    api_key => "${xput.api_key}"`
      if (xput.environment === 'cloud')
        config += `
    cloud_id => "${xput.cloud_id}"`
      else
        config += `
    # TODO: Handle non-cloud settings`

      return (
        config +
        `
  }
}
`
      )
    },
    /*
     * HTTP output, which takes a lot of options
     */
    http: async (xput, pipeline, pipelineId) => {
      // FIXME: This is here for debugging, and can be removed
      await writeFile(
        `/etc/morio/connector/pipeline_assets/${pipelineId}_output.json`,
        JSON.stringify(xput, null, 2)
      )

      let config = `
# Move the entire event to the 'event' key
filter {
  ruby {
    code => "event.set('event', event.to_hash)"
  }
}

# Remove all keys but the event key
filter {
  prune {
    whitelist_names => [ "event" ]
  }
}

# Add required Splunk HEC fields
filter {
  mutate {
    add_field => {
      "host" => "%{[event][host][hostname]}"
      "sourcetype" => "_json"
    }
  }
}

# Convert ECS @timestamp to Splunk's ;time; field in epoch format
filter {
  ruby {
    code => "
      timestamp = event.get('event')['@timestamp']
      if timestamp
        formatted_time = '%.3f' % timestamp.to_f
        event.set('time', formatted_time)
      end
    "

    # code => "event.set('time', event.get('[event][@timestamp]').to_f)"
  }
}
`

      config += `


# Output data to an HTTP endpoint
output {
  http {
    url => "${xput.url}"
`
      /*
       * Files
       * Certificate data is passed in directly, but logstash expects a path to a file
       */
      //const sslFields = ['ssl_certificate', 'ssl_certificate_authorities', 'ssl_key']
      //for (const field of sslFields) {
      //  if (xput[field])
      //    await writeFile(
      //      `/etc/morio/connector/pipeline_assets/${pipelineId}_${field}`,
      //      xput[field],
      //      log
      //    )
      //  config += fileField(field, xput, pipelineId, field === 'ssl_certificate_authorities')
      //}

      /*
       * Numbers
       * This is an array with [field_name, default_value] elements
       */
      const numFields = [
        ['automatic_retries', 1],
        ['connect_timeout', 10],
        ['request_timeout', 60],
        ['socket_timeout', 10],
        ['pool_max', 50],
        ['pool_max_per_route', 25],
        ['validate_after_inactivity', 200],
      ]
      for (const [field, dflt] of numFields) config += numField(field, xput, dflt)

      /*
       * Booleans
       * This is an array with [field_name, default_value] elements
       */
      const boolFields = [
        ['cookies', true],
        ['follow_redirects', true],
        ['keepalive', true],
        ['retry_failed', true],
        ['retry_non_idempotent', false],
      ]
      for (const [field, dflt] of boolFields) config += boolField(field, xput, dflt)

      /*
       * Strings
       * This is an array with [field_name, default_value] elements
       */
      const stringFields = [
        ['content_type', undefined],
        ['proxy', undefined],
        ['format', 'json'],
        ['http_method', undefined],
        ['message', undefined],
      ]
      for (const [field, dflt] of stringFields) config += stringField(field, xput, dflt)

      /*
       * headers
       */
      if (xput.headers) {
        for (const i of Object.keys(xput.headers))
          config += `    headers => ["${xput.headers[i].key}", "${xput.headers[i].val}"]${nl}`
      }

      /*
       * mapping
       */
      if (xput.mapping && Object.keys(xput.mapping).length > 0) {
        let mapping = `    mapping => {${nl}`
        for (const i of Object.keys(xput.mapping))
          mapping += `      "${xput.mapping[i].key}" => "${xput.mapping[i].val}"${nl}`
        config += `${mapping}    }${nl}`
      }

      /*
       * Ignorable_codes
       */
      if (xput.ignorable_codes)
        config += `    ignorable_codes => ${JSON.stringify(
          xput.ignorable_codes.split(',').map((code) => Number(code.trim()))
        )}${nl}`

      /*
       * retryable_codes
       */
      if (xput.retryable_codes)
        config += `    retryable_codes => ${JSON.stringify(
          xput.retryable_codes.split(',').map((code) => Number(code.trim()))
        )}${nl}`

      /*
       * SSL verification
       */
      if (xput.url.toLowerCase().slice(0, 5) === 'https') config += `    ssl_verification_mode => "${xput._ssl_validate ? 'full' : 'none'}"${nl}`

      /*
       * Close braces
       */
      config += `  }${nl}}${nl}`


      return config
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
    bootstrap_servers => "${utils
      .getBrokerFqdns()
      .map((fqdn) => `${fqdn}:9092`)
      .join(',')}"
    client_id => "morio_connector_output"
    id => "${pipelineId}_${xput.id}"
    security_protocol => "SSL"
    ssl_endpoint_identification_algorithm => "https"
    ssl_keystore_location => "/usr/share/logstash/config/pipeline_assets/guistore.p12"
    ssl_keystore_password => "${utils.getPreset('MORIO_CONNECTOR_P12_PASSWORD')}"
    ssl_keystore_type => "PKCS12"
    ssl_truststore_location => "/usr/share/logstash/config/pipeline_assets/guistore.p12"
    ssl_truststore_password => "${utils.getPreset('MORIO_CONNECTOR_P12_PASSWORD')}"
    ssl_truststore_type => "PKCS12"
  }
}
`,
  },
}

const numField = (field, data, dflt) =>
  typeof data[field] !== 'undefined'
    ? `    ${field} => ${Number(data[field])}${nl}`
    : `    ${field} => ${Number(dflt)}${nl}`

const boolField = (field, data, dflt) =>
  typeof data[field] !== 'undefined'
    ? `    ${field} => ${data[field] ? 'true' : 'false'}${nl}`
    : `    ${field} => ${dflt ? 'true' : 'false'}${nl}`

const fileField = (field, data, pipelineId, list = false) =>
  typeof data[field] !== 'undefined'
    ? `    ${field} => ${list ? '[' : ''}"/usr/share/logstash/config/pipeline_assets/${pipelineId}_${field}"${list ? ']' : ''}${nl}`
    : ``

const stringField = (field, data, dflt) =>
  typeof data[field] !== 'undefined' && data[field] !== ''
    ? `    ${field} => ${String(data[field])}${nl}`
    : dflt === undefined
      ? ``
      : `    ${field} => ${String(dflt)}${nl}`
