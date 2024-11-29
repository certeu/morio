// VARS

/*
 * A helper var to include a linebrek
 */
export const nl = '\n'

// METHODS

/**
 * Add configuration for a boolean field
 *
 * @param {string} field - The field name
 * @param {object} data - The plugin/pipeline config
 * @param {mixed} dflt - The default value if the field is not in data
 * @return {string} cfg - The config snippet for this boolean field
 */
export function boolField(field, data, dflt) {
  return typeof data[field] !== 'undefined'
    ? `    ${field} => ${data[field] ? 'true' : 'false'}${nl}`
    : `    ${field} => ${dflt ? 'true' : 'false'}${nl}`
}

/**
 * Add configuration for a number field
 *
 * @param {string} field - The field name
 * @param {object} data - The plugin/pipeline config
 * @param {mixed} dflt - The default value if the field is not in data
 * @return {string} cfg - The config snippet for this number field
 */
export function numberField(field, data, dflt) {
  return typeof data[field] !== 'undefined'
    ? `    ${field} => ${Number(data[field])}${nl}`
    : `    ${field} => ${Number(dflt)}${nl}`
}

/**
 * Add configuration for a file field
 *
 * @param {string} field - The field name
 * @param {object} data - The plugin/pipeline config
 * @param {mixed} dflt - The default value if the field is not in data
 * @return {string} cfg - The config snippet for this number field
 */
export function fileField(field, data, pipelineId, list = false) {
  return typeof data[field] !== 'undefined'
    ? `    ${field} => ${list ? '[' : ''}"/usr/share/logstash/config/pipeline_assets/${pipelineId}_${field}"${list ? ']' : ''}${nl}`
    : ``
}

/**
 * Add configuration for a string field
 *
 * @param {string} field - The field name
 * @param {object} data - The plugin/pipeline config
 * @param {mixed} dflt - The default value if the field is not in data
 * @return {string} cfg - The config snippet for this string field
 */
export function stringField(field, data, dflt) {
  return typeof data[field] !== 'undefined' && data[field] !== ''
    ? `    ${field} => ${String(data[field])}${nl}`
    : dflt === undefined
      ? ``
      : `    ${field} => ${String(dflt)}${nl}`
}
