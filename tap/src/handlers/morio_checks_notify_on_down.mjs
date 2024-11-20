/*
 * This is a Morio handler to create a notification when something is down
 */
const handler = {
  topic: 'checks',
  filter: ({ data={} }) => data.summary?.status === "down",
  method: ({ data }, tools) => {
    tools.log.warn(data.summary, 'Something is down!')
  }
}

export default handler

