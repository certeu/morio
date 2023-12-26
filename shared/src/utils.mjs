export const capitalize = (string) =>
  typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : ''

export const asPojo = (obj) => JSON.parse(JSON.stringify(obj))

/*
 * Wrap express with proper signal handling
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
      process.exit(128 + value)
    })
  }

  /*
   * Create a listener for the different signals we want to handle
   */
  Object.keys(signals).forEach((signal) => {
    process.on(signal, () => shutdown(signal, signals[signal]))
  })

  return server
}
