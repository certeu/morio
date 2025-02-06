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
