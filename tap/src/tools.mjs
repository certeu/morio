import pino from 'pino'

/*
 * Export log object for logging via the Pino logger
 */
export const log = pino({ name: 'tap', level: 20 })


/*
 * Tools are exported as a single object
 * so we can pass it to processor functions
 */
export const tools = {
  /*
   * Log object for logging via the logger
   */
  log,

  /*
   * Returns current timestamp in seconds
   *
   * @return {number} s - Current timestamp in seconds
   */
  now: function () {
    return Math.floor(Date.now() / 1000)
  },

  /*
   * Returns current timestamp in milliseconds
   *
   * @return {number} ms - Current timestamp in milliseconds
   */
  timestamp: function () {
    return Date.now()
  }
}

