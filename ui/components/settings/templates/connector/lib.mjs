export const vectorTemplates = {
  source: {
    blank: {},
    'Morio (local)': {
      type: 'local_morio',
      topics: [],
    },
  },
  sink: {
    blank: {},
    'Morio (local)': {
      type: 'local_morio',
      topics: [],
    },
    'Splunk (logs)': {
      type: 'splunk_hec_logs',
      inputs: ['input-or-transform-id-here'],
      endpoint: 'hec-endpoint-base-url-here',
      endpoint_target: 'event',
      index: '{{ host }}',
      source: '{{ file }}',
      timestamp_key: 'timestamp',
      buffer: {
        type: 'disk',
        max_size: 5e9,
        when_full: 'block',
      },
      default_token: '{{ SPLUNK_HEC_TOKEN }}',
      encoding: {
        codec: 'json',
      },
      sourcetype: '_json',
    },
  },
  transform: {
    blank: {},
    remap: {
      type: 'remap',
      inputs: [],
      timezone: 'local',
      source: '',
    },
  },
}
