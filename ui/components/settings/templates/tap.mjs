import Joi from 'joi'
import { Popout } from 'components/popout.mjs'
import { FilterIcon, TrashIcon, BoolYesIcon, BoolNoIcon } from 'components/icons.mjs'

const tapFilterExample = "(data) => (data.morio?.tags || []).includes('example')\n"

const enableToggle = ({ key, dflt=false, list, label, help=false, current }) => ({
  schema: Joi.boolean().default(dflt),
  key,
  dflt,
  list,
  inputType: 'buttonList',
  label,
  current,
  help: help ? help : undefined
})

/*
 * Tap (stream processing)
 *
 * This holds the configuration wizard view settings for the tap service
 */
export const tap = ({ mSettings={}, update, dconf=false }) => {

  // We'll re-use this
  const title = 'Stream Processing'

  /*
   * dconf.tap should hold the dynamic tap configuration
   * If not return early
   */
  if (!dconf?.tap || typeof dconf.tap !== 'object' || Object.keys(dconf.tap).length < 1) {
    return {
      title,
      about: `Once you add one or more stream processors, you will be able to configure them here.

Refer to [the stream processing guide](https://morio.it/docs/guides/stream-processing?FIXME-write-this-guide) to get started.`,
      type: 'info',
      children: {}
    }
  }

  /*
   * Basic structure for this template
   */
  const template = {
    title: 'test',
    about: `Morio's __Tap__ service facilitates __stream processing__ of data flowing through a Morio collector.

It abstracts the tricky parts of stream processing away,
so you can bring your own logic and have the Tap service handle the stream for you.

Note that stream processors do not ship with Morio, but need to be loaded dynamically.
Currently, the following stream processorts are loaded:

${Object.keys(dconf.tap).map(name => `- ${dconf.tap[name].title || name}`).join("\n")}

Refer to [the stream processing guide](https://morio.it/docs/guides/stream-processing?FIXME-write-this-guide) to get started.`,
    type: 'info',
    children: {}
  }

  /*
   * Iterate over the tap handlers to add the children
   */
  for (const [name, conf] of Object.entries(dconf.tap)) {
    const docs = conf.docs
      ? [
        `### Documentation`,
        `The ${conf.title} documentation is available at: [${conf.docs}](${conf.docs}).`,
      ] : []
    const child = {
      type: 'form',
      title: conf.title,
      about: conf.about,
      form: [
        `### About the ${conf.title}`,
        conf.about,
        ...docs,
        ...dynamicForm({ conf, dkey: name, mSettings, update }),
      ]
    }
    template.children[name] = child
  }

  return template
}

function dynamicForm ({ conf, dkey, mSettings, update }) {
  if (!conf.settings) return null

  const form = [ '### Settings' ]
  for (const [key, val] of Object.entries(conf.settings)) {
    form.push(...dynamicFormSetting(key, val, dkey, mSettings, update))
  }

  return form
}

function dynamicFormSetting (key, val, dkey, mSettings, update) {
  if (val.type === 'list') return dynamicFormListSetting(key, val, dkey, mSettings, update)
  if (val.type === 'labels') return dynamicFormLabelsSetting(key, val, dkey, mSettings, update)
  if (val.type === 'number') return dynamicFormNumberSetting(key, val, dkey, mSettings, update)

  return key ? [`No dynamic form method for ${key}`, <pre>{JSON.stringify(val, null ,2)}</pre>] : []
}

function dynamicFormListSetting (key, val, dkey, mSettings, update) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt

  return [
    <h4 className="mt-8">{val.title}</h4>,
    val.about ? val.about : [],
    {
      schema: Joi.boolean().default(val.dflt),
      key: `tap.${dkey}.${key}`,
      dflt: val.dflt,
      list: val.list,
      inputType: 'buttonList',
      current,
      activeIcon: current ? <BoolYesIcon size="8" /> : <BoolNoIcon size="8" />,
      ...dynamicFormLabels(val),
    },
  ]
}

function dynamicFormLabelsSetting (key, val, dkey, mSettings, update) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt
  if (Array.isArray(current)) {
    const newCurrent = {}
    for (const entry of current) newCurrent[entry] = entry
    current = newCurrent
  }

  return [
    <h4 className="mt-8">{val.title}</h4>,
    val.about ? val.about : [],
    {
      schema: Joi.array().items(Joi.string()).optional().label(val.label || val.title),
      key: `tap.${dkey}.${key}`,
      dflt: val.dflt,
      inputType: 'labels',
      current,
      ...dynamicFormLabels(val),
    }
  ]
}

function dynamicFormNumberSetting (key, val, dkey, mSettings, update) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt

  return [
    <h4 className="mt-8">{val.title}</h4>,
    val.about ? val.about : [],
    {
      schema: Joi.number(),
      key: `tap.${dkey}.${key}`,
      dflt: val.dflt,
      current,
      ...dynamicFormLabels(val),
    },
  ]
}

function dynamicFormLabels (val) {
  return {
    label: val.label ? val.label : false,
    labelBL: val.labelBL ? val.labelBL : false,
    labelBR: val.labelBR ? val.labelBR : false,
    labelTR: val.labelRT ? val.labelTR : false,
  }
}


/*
  return {
    about: (
      <>
        <p>
          Morio&apos;s <b>Tap</b> service facilitates <b>stream processing</b> of data flowing through a Morio collector.
        </p>
        <p>It abstracts the tricky parts of stream processing away, so you can bring your own logic and have the Tap service handle the stream for you.</p>
      </>
    ),
    title: 'Stream-Processing',
    type: 'info',
    children: {
      audit: {
        type: 'form',
        title: 'Audit Handler',
        form: builtinForm('audit', mSettings, update, {
          enabled: true,
          topics: asObj('audit'),
          modules: {},
          filter: false,
          cache: true,
          ttl: 12,
          eventify: true,
        })
      },
      checks: {
        type: 'form',
        title: 'Checks Handler',
        form: builtinForm('checks', mSettings, update, {
          enabled: true,
          topics: asObj('checks'),
          modules: {},
          filter: false,
          cache: true,
          ttl: 1,
          up_values: asObj([1, 'green', 'up']),
          escalate_when_down: true,
          certificate_check: true,
          certificate_days: 21,
        })
      },
      events: {
        type: 'form',
        title: 'Events Handler',
        form: builtinForm('events', mSettings, update, {
          enabled: true,
          topics: asObj('events'),
          modules: {},
          filter: false,
          cache: true,
          ttl: 12,
        })
      },
      inventory: {
        type: 'form',
        title: 'Inventory Handler',
        form: builtinForm('inventory', mSettings, update, { enabled: true }),
        _form: (data) => ([
          {
            schema: Joi.bool().label('enabled'),
            inputType: 'buttonList',
            key: `tap.builtin.inventory.enabled`,
            dflt: true,
            list: [
              {
                val: true,
                label: 'Enable',
                about: 'Over time, the inventory Tap handler will build out an inventory of your infrastructure based on the data collected by Morio',
              },
              {
                val: false,
                label: 'Disable',
              },
            ],
            current: data.enabled === false ? false : true,
          },
          <Popout note>
            <h4>The inventory handler does not take any configuration</h4>
            <p>You can only enable or disable it.</p>
          </Popout>,
        ]),
      },
      logs: {
        type: 'form',
        title: 'Logs Handler',
        form: builtinForm('logs', mSettings, update, {
          enabled: true,
          topics: asObj('logs'),
          modules: {},
          filter: false,
          cache: true,
          ttl: 1,
        })
      },
      metrics: {
        type: 'form',
        title: 'Metrics Handler',
        form: builtinForm('metrics', mSettings, update, {
          enabled: true,
          topics: asObj('metrics'),
          modules: {},
          filter: false,
          cache: true,
          ttl: 1,
          cap: 300
        })
      },
      custom: {
        type: 'form',
        title: 'Custom Handlers',
        form: [
          <Popout fixme>
            <h4>Under construction</h4>
            <p>This feature is not yet fully implemented.</p>
          </Popout>
        ],
      },
    },
  }
}

*/
/**
 * It gets boring real quick to type { logs: 'logs' }
 *
 * @param {string} topic - The topic name
 * @return {object} obj - An object to go in the config with topic name as key and value
 */
function asObj (topic) {
  const data = {}
  if (Array.isArray(topic)) {
    for (const key of topic) data[key] = key
  }
  else data[topic] = topic

  return data
}

