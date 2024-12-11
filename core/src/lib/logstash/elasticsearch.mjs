// Log
import { log } from '../utils.mjs'
// helpers
import { nl } from './lib.mjs'

/**
 * Generates a logstash output configuration for the elasticsearch plugin
 *
 * @param {object} output - The output configuration
 * @param {object} pipeline - The pipeline configuration
 * #return {string} lscl - The LSCL code
 */
export function elasticsearchOutput(output = {}, pipeline = {}) {
  /*
   * Do not continue if we do not ahve what it takes
   */
  if (!output.api_key || !pipeline.output?.index) {
    log.warn(
      `A logstash Elasticsearch output misses a required field: ${output.api_key ? 'pipeline.output.index' : 'output.api_jkey'}. It will be disabled.`
    )
    return `${nl}${nl}# This output is disabled because it lacks a required field${nl}${nl}`
  }
  if (output.environment === 'cloud' && !output.cloud_id) {
    log.warn(
      `A logstash Elasticsearch output misses a required field: output.cloud_id. It will be disabled.`
    )
    return `${nl}${nl}# This output is disabled because it lacks a required field${nl}${nl}`
  }

  let config = `
# Output data to Elasticsearch
output {
  elasticsearch {
    action => "create"
    compression_level => ${output.compression_level || 2}
    ecs_compatibility => "${['disabled', 'v1', 'v8'].includes(pipeline.output.enforce_ecs) ? pipeline.output.enforce_ecs : 'v8'}"
    index => "${pipeline.output.index}"
    api_key => "${output.api_key}"`
  if (output.environment === 'cloud')
    config += `
    cloud_id => "${output.cloud_id}"`
  else
    config += `
    # TODO: Handle non-cloud settings`

  return config + `${nl}  }${nl}}`
}
