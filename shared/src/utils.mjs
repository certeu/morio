import { setTimeout } from 'node:timers/promises'
/**
 * Capitalize the first character of a string
 *
 * @param {string} string - The string to capitalize
 * @return {string} result - The string with its first character capitalized
 */
export const capitalize = (string) =>
  typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : ''

/**
 * Clone a data structure in a way that ensures no references
 * are kept, and it's just a plain old javascript object (pojo)
 *
 * @param {object} obj - The object to clone
 */
export const cloneAsPojo = (obj) => JSON.parse(JSON.stringify(obj))

/**
 * Sleeps for a number of seconds in a async way
 *
 * This is a helper method to wait for a given amount of time
 * without blocking the even loop. This is typically used to
 * give containers time to spin up, and so on
 *
 * @param {number} seconds - Time to sleep in seconds
 * @return {promise} result - Returns a promise
 */
export const sleep = async (seconds) => await setTimeout(seconds * 1000)

/*
 * This method will continue attempting to get a truthy result every seconds until timeout
 *
 * @param {object} opts - An object controlling how this method behaves
 * @param {number} opts.every - Number of seconds to run the interval on
 * @param {number} opts.timeout - Number of seconds after which to give up
 * @param {function} opts.run - Method to run on each interval
 * @param {function} opts.onFailedAttempt - Callback to run when an attempt fails
 * @return {promise} result - The promise
 */
export const attempt = async ({
  every = 2,
  timeout = 60,
  run,
  onFailedAttempt = false
}) => new Promise((resolve) => tryWhilePromiseResolver({ every, timeout, run, onFailedAttempt }, resolve))

/*
 * Promise resolver functions should not be async
 * so this method is here to side-step that
 */
const tryWhilePromiseResolver = async ({ every, timeout, run, onFailedAttempt }, resolve) => {
  /*
   * Quick check
   */
  let ok
  try {
    ok = await run()
  }
  catch (err) {
    tools.log.debug(err)
  }

  if (ok) return resolve(ok)

  /*
   * Keep trying until timeout
   */
  const now = Date.now()
  const interval = setInterval(async () => {
    let ok
    try {
      ok = await run()
    }
    catch (err) {
      tools.log.debug(err)
    }
    if (ok) {
      clearInterval(interval)
      return resolve(ok)
    } else {
      const delta = (Date.now() - now) / 1000
      if (delta > timeout * 1000) return resolve(false)
      else if (onFailedAttempt && typeof onFailedAttempt === 'function') onFailedAttempt(Math.floor(delta))
    }
  }, every * 1000)
}

/**
 * Wrap express with proper signal handling
 *
 * @param {object} log - A logger instance
 * @param {object} server - The Express server instance
 * @return {object} server - The Express server instance
 */
export const wrapExpress = (log, server) => {
  /*
   * These are the signals we want to handle
   */
  const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
  }

  /*
   * This method will be called on shutdown
   */
  const shutdown = (signal, value) => {
    log.info(`Received a ${signal} signal. Initiating shutdown.`)
    server.close(() => {
      log.info(`Shutdown finalized. Exiting.`)
      process.exit(128 + value) /* eslint-disable-line no-undef */
    })
  }

  /*
   * Create a listener for the different signals we want to handle
   */
  Object.keys(signals).forEach((signal) => {
    process.on(signal, () => shutdown(signal, signals[signal])) /* eslint-disable-line no-undef */
  })

  return server
}
