import Joi from 'joi'
import { Popout } from 'components/popout.mjs'

const enableToggle = ({ key, label, dflt=false, list=[true, false], labels=['Enabled', 'Disabled'] }) => ({
  schema: Joi.boolean().default(dflt).label(label),
  label,
  key,
  dflt,
  list,
  labels,
})

const topicsEl = ({ key, data }) => ({
  label: 'Topics',
  schema: Joi.string().allow('').label('Topics'),
  dflt: 'logs',
  current: data?.topics ? data.topics : 'logs',
  key,
  labelBL: 'A comma-seperated list of topics to subscribe to',
})

const handlerForms = {
  logs: (data) => ({
    topics: [
      topicsEl({ key: `tap.builtin.logs.topics`, data }),
    ],
    filter: [
      <p>
        You can optionally provide a filter method.
        If it returns <code>true</code> the message will be passed to the handler.
        If not, it will be skipped.
      </p>,
      <p>
        By default, all messages will be passed to the handler.
      </p>,
      {
        schema: Joi.string().allow('').label('Filter method'),
        dflt: '',
      }
    ],
  }),
}

function builtinForm (type, mSettings, update) {
  const data = mSettings?.tap?.builtin?.[type] || {}
  const blocks = [
    <h3 className="capitalize">{type} handler</h3>,
    <p>{builtin[type]}</p>,
    {
      tabs: {
        Features: [
          [
            enableToggle({
              key: `tap.builtin.${type}.enabled`,
              label: `Enable the ${type} handler`,
            }),
            data.enabled ?  enableToggle({
              key: `tap.builtin.${type}.cache`,
              label: `Cache ${type} data`,
              current: data?.cache === false ? false : true
            }) : <span className="text-sm opacity-70 mt-4">Enable this handler for more features</span>,
          ]
        ]
      }
    }
  ]

  if (data.enabled && handlerForms[type]) blocks[2].tabs = {...blocks[2].tabs, ...handlerForms[type](data) }

  return blocks
}

const builtin = {
  audit: 'Cache audit events, and optionally notify based on conditions you specify.',
  healtchecks: '',
  inventory: '',
  metrics: '',
  logs: 'Caches log data, and allows you to raise a notifications on conditions you specify.',
}

function builtinFormBuilder (mSettings, update) {
  const form = [
    <p>These Tap handlers are built-in. You can configure them here, or disable them entirely.</p>,
    <Popout tip>
      <h5>Streaming Data Terminology</h5>
      <ul className="list list-inside list-disc ml-4">
        <li><b>topic</b>: a specific feed where messages are read from</li>
        <li><b>message</b>: a single data entry in a topic</li>
      </ul>
    </Popout>
  ]
  for (const type in builtin) form.push(...builtinForm(type, mSettings, update))

  return form
}


/*
 * Tap (stream processing)
 *
 * This holds the configuration wizard view settings for the tap service
 */
export const tap = ({ mSettings={}, update }) => ({
  about: (
    <>
      <p>
        Morio&apos;s <b>Tap</b> service facilitates <b>stream processing</b> of data flowing through a Morio collector.
      </p>
      <p>It abstracts the tricky parts of stream processing away, and You can use its on-board features, or bring your own logic and have the Tap service handle the stream for you.</p>
    </>
  ),
  title: 'Tap Service (Stream Processing)',
  type: 'info',
  children: {
    builtin: {
      type: 'form',
      title: 'Built-in Tap Handlers',
      form: builtinFormBuilder(mSettings, update)
    },
    custom: {
      type: 'secrets',
      title: 'Custom Handlers',
    },
  },
})


