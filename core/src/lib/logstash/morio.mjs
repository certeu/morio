// log & utils
import { utils } from '../utils.mjs'

/**
 * Generates a logstash input configuration for the local Morio broker
 *
 * @param {object} input - The input configuration
 * @param {object} pipeline - The pipeline configuration
 * @param {string} pipelineID - The pipeline ID
 * @return {string} lscl - The LSCL code
 */
export function localMorioInput(input, pipeline, pipelineId) {
  return `
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
    id => "${pipelineId}_${input.id}"
    security_protocol => "SSL"
    ssl_endpoint_identification_algorithm => ""
    ssl_keystore_location => "/usr/share/logstash/config/pipeline_assets/local-keystore.pem"
    ssl_keystore_type => "PEM"
    ssl_truststore_location => "/usr/share/logstash/config/pipeline_assets/local-truststore.pem"
    ssl_truststore_type => "PEM"
  }
}
`
}

/**
 * Generates a logstash output configuration for the local Morio broker
 *
 * @param {object} input - The output configuration
 * @param {object} pipeline - The pipeline configuration
 * @param {string} pipelineID - The pipeline ID
 * @return {string} lscl - The LSCL code
 */
export function localMorioOutput(output, pipeline, pipelineId) {
  return `
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
    id => "${pipelineId}_${output.id}"
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
`
}
