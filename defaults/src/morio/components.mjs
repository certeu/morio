///////////////////////////////////////////////////////////////////////////////
//  API
///////////////////////////////////////////////////////////////////////////////

/*
 * API log level
 * One of: trace, debug, info, warn, error, fatal, silent
 */
export const MORIO_API_LOG_LEVEL = 'debug'

/*
 * TCP port API should listen on
 */
export const MORIO_API_PORT = 3000

///////////////////////////////////////////////////////////////////////////////
//  SAM
///////////////////////////////////////////////////////////////////////////////

/*
 * Location of the Docker socket
 */
export const MORIO_SAM_DOCKER_SOCKET = '/var/run/docker.sock'

/*
 * SAM log level
 * One of: trace, debug, info, warn, error, fatal, silent
 */
export const MORIO_SAM_LOG_LEVEL = 'debug'

/*
 * TCP port SAM should listen on
 */
export const MORIO_SAM_PORT = 3020

///////////////////////////////////////////////////////////////////////////////
//  UI
///////////////////////////////////////////////////////////////////////////////

/*
 * Port the UI listens on
 */
export const MORIO_UI_PORT = 3010

/*
 * Timeout URL check after this many milliseconds
 */
export const MORIO_UI_TIMEOUT_URL_CHECK = 1500

/*
 * Combined named export
 */
export const defaults = {
  // API
  MORIO_API_LOG_LEVEL,
  MORIO_API_PORT,
  // SAM
  MORIO_SAM_DOCKER_SOCKET,
  MORIO_SAM_LOG_LEVEL,
  MORIO_SAM_PORT,
  // UI
  MORIO_UI_PORT,
  MORIO_UI_TIMEOUT_URL_CHECK,
}
