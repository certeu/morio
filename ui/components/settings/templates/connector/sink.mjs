import { xputMeta } from './index.mjs'

/*
 * Sink output Connector templates
 */
export const sink = {
  out: (context) => ({
    title: 'Trash',
    about: 'Discards data (useful for pipeline testing)',
    desc: 'Use this to throw out the pipeline output',
    local: (data) => `connector.outputs.${data.id}`,
    form: xputMeta('output', 'sink'),
  }),
}
