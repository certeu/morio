import { writeFile } from '#shared/fs'
// log
import { log } from '../utils.mjs'
// helpers
import { nl, boolField, fileField, numberField, stringField } from './lib.mjs'

/**
 * Generates a logstash output configuration for the http plugin
 *
 * @param {object} output - The output configuration
 * @param {object} pipeline - The pipeline configuration
 * @param {string} pipelineID - The pipeline ID
 * #return {string} lscl - The LSCL code
 */
export async function httpOutput(output, pipeline, pipelineId) {
  let config = `
# Output data to an HTTP endpoint
output {
  http {
    url => "${output.url}"
`
  /*
   * Files
   * Certificate data is passed in directly, but logstash expects a path to a file
   */
  const sslFields = ['ssl_certificate', 'ssl_certificate_authorities', 'ssl_key']
  for (const field of sslFields) {
    if (output[field])
      await writeFile(
        `/etc/morio/connector/pipeline_assets/${pipelineId}_${field}`,
        output[field],
        log
      )
    config += fileField(field, output, pipelineId, field === 'ssl_certificate_authorities')
  }

  /*
   * Numbers
   * This is an array with [field_name, default_value] elements
   */
  const numberFields = [
    ['automatic_retries', 1],
    ['connect_timeout', 10],
    ['request_timeout', 60],
    ['socket_timeout', 10],
    ['pool_max', 50],
    ['pool_max_per_route', 25],
    ['validate_after_inactivity', 200],
  ]
  for (const [field, dflt] of numberFields) config += numberField(field, output, dflt)

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
  for (const [field, dflt] of boolFields) config += boolField(field, output, dflt)

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
  for (const [field, dflt] of stringFields) config += stringField(field, output, dflt)

  /*
   * headers
   */
  if (output.headers) {
    for (const i of Object.keys(output.headers))
      config += `    headers => ["${output.headers[i].key}", "${output.headers[i].val}"]${nl}`
  }

  /*
   * mapping
   */
  if (output.mapping && Object.keys(output.mapping).length > 0) {
    let mapping = `    mapping => {${nl}`
    for (const i of Object.keys(output.mapping))
      mapping += `      "${output.mapping[i].key}" => "${output.mapping[i].val}"${nl}`
    config += `${mapping}    }${nl}`
  }

  /*
   * Ignorable_codes
   */
  if (output.ignorable_codes)
    config += `    ignorable_codes => ${JSON.stringify(
      output.ignorable_codes.split(',').map((code) => Number(code.trim()))
    )}${nl}`

  /*
   * retryable_codes
   */
  if (output.retryable_codes)
    config += `    retryable_codes => ${JSON.stringify(
      output.retryable_codes.split(',').map((code) => Number(code.trim()))
    )}${nl}`

  /*
   * SSL verification
   */
  if (output.url.toLowerCase().slice(0, 5) === 'https')
    config += `    ssl_verification_mode => "${output._ssl_validate ? 'full' : 'none'}"${nl}`

  /*
   * Close braces
   */
  config += `  }${nl}}${nl}`

  return config
}
