// helpers
import { nl } from './lib.mjs'

/**
 * Generates a logstash output configuration for the http plugin
 *
 * @param {object} output - The output configuration
 * @param {object} pipeline - The pipeline configuration
 * #return {string} lscl - The LSCL code
 */
export function elasticsearchOutput(output, pipeline) {
  //data_stream => ${pipeline.output.index_type === 'docs' ? "false" : "true"}
  //data_stream_auto_routing => false
  let config = `
# Output data to Elasticsearch
output {
  elasticsearch {
    action => "create"
    compression_level => ${output.compression_level}
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
