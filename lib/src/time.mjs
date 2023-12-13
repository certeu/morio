/*
 * Returns seconds since a given timestamp
 *
 * @param {number} timestamp - Node timestamp (milliseconds since epoch)
 * @return {number} delta - Number of seconds since the timestamp
 */
export const secondsSince = (timestamp) => (Date.now() - timestamp) / 1000

/*
 * Returns time since a given timestamp
 *
 * @param {number} timestamp - Node timestamp (milliseconds since epoch)
 * @return {object} result - An object with time_since and seconds_since keys
 * where time_since is a natural language approximation of seconds since
 */
export const timeSince = (timestamp) => {
  let time_since

  /*
   * Calculate time delta as a number of seconds
   */
  const seconds_since = secondsSince(timestamp)

  /*
   * Report in seconds if it is below 120 seconds
   */
  if (seconds_since < 120) time_since = `${Math.floor(seconds_since*10)/10} seconds`

  /*
   * Report in minutes + seconds if it is below 10 minutes
   */
  else if (seconds_since < 600) {
    const minutes = Math.floor(seconds_since/60)
    const seconds = Math.floor(seconds_since-(60*minutes))
    time_since = `${minutes} minutes and ${seconds} seconds`
  }

  /*
   * Report in minutes if it is below 120 minutes
   */
  else if (seconds_since < 120 * 60) {
    const minutes = Math.floor(seconds_since/60)
    const seconds = Math.floor(seconds_since-(60*minutes))
    time_since = `${Math.floor(seconds_since/60)} minutes`
  }

  /*
   * Report in hours + minutes if it is below 6 hours
   */
  else if (seconds_since < 6 * 60 * 60) {
    const hours = Math.floor(seconds_since/3600)
    const minutes = Math.floor((seconds_since-(3600*hours) / 60))
    time_since = `${hours} hours and ${minutes} minutes`
  }

  /*
   * Report in hours if it is below 75 hours
   */
  else if (seconds_since < 75 * 60 * 60) {
    const hours = Math.floor(seconds_since/3600)
    time_since = `${hours} hours`
  }

  /*
   * Report in days
   */
  else {
    const days = Math.floor(seconds_since/(3600*24))
    time_since = `${days} days`
  }

  return { time_since, seconds_since }
}


