/*
 * Configuration for the morio_logs_cache handler
 */
export const config = {
  enabled: true,
  handler: {
    topic: 'metrics',
    filter: ({ data }) => (data?.morio?.module === 'morio-tap'),
  },
  ttl: 3600, // 1 hour
  cap: 300, // max sets
}

export const docs = {
  name: 'Metrics handler for the morio-tap module',
  description: `
This stream processing handler processes metrics from morio-tap module.

The morio-tap module is a bit unlike other modules which are typically client modules that collect data.
Morio-tap however does not expose metrics to the Morio client to collect and ingest.
Instead, it directly ingests its own metrics data into the kafka topic.

Once ingested, everything works the same, butit's important to understand that this works without any Morio client running.`,
  config: {
    enabled: "Set this to false to disable this handler.",
    ttl: "The number of seconds before the metricset will expire from the cache.",
    cap: "The maximum number of sets to keep in the cache. This is a hard limit in case the polling interval is very low."
  }
}

