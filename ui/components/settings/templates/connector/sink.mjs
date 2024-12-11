import { xputMeta } from './index.mjs'

/*
 * Sink output Connector templates
 */
export const sink = {
  output: () => ({
    title: 'Trash',
    about: 'Discards data (useful for pipeline testing)',
    desc: 'Use this to throw away the pipeline output',
    local: (data) => `connector.outputs.${data.id}`,
    form: xputMeta('output', 'sink'),
  }),
}
