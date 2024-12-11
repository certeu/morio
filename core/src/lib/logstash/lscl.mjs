import { nl } from './lib.mjs'

/**
 * Generates a logstash input configuration based on LSCL
 *
 * @param {object} input - The input configuration
 * @return {string} lscl - The LSCL code
 */
export function lsclInput(input) {
  return lsclBlock('input', input)
}

/**
 * Generates a logstash filter configuration based on LSCL
 *
 * @param {object} filter - The filter configuration
 * @return {string} lscl - The LSCL code
 */
export function lsclFilter(filter) {
  return lsclBlock('filter', filter)
}


/**
 * Generates a logstash output configuration based on LSCL
 *
 * @param {object} output - The output configuration
 * @return {string} lscl - The LSCL code
 */
export function lsclOutput(output) {
  return lsclBlock('output', output)
}

/**
 * Generates a logstash output block based on LSCL
 *
 * @param {object} config - The input/output/filter configuration
 * @param {string} type - The type of block (input, output, or filter)
 * @return {string} lscl - The LSCL code
 */
export function lsclBlock(type, config) {
  return config.wrap
  ? `${nl}${nl}# LSCL ${type}${nl}${type} {${nl}${config.lscl}${nl}}${nl}`
  : `${nl}# LSCL ${type}${nl}${config.lscl}${nl}`
}



