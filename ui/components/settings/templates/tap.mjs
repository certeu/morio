import Joi from 'joi'
import { BoolYesIcon, BoolNoIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'

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
    title: 'Stream Processing',
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
    const title = conf.title ? conf.title : name
    const docs = conf.docs ? conf.docs : (
      <Popout note>
        <h4>This stream processor does not provide this info</h4>
        <p>The <code>{name}</code> stream processor does not provide any <b>about</b> info.</p>
      </Popout>
    )
    const href = conf.href
      ? [
        <Popout link key="popout">
          <h5>Learn more about this stream processor</h5>
          <a href={conf.href}>{conf.href}</a>
        </Popout>
      ] : []
    const child = {
      type: 'form',
      title,
      docs,
      form: [
        `### About`,
        docs,
        ...href,
        ...dynamicForm({ conf, dkey: name, mSettings, update, name }),
      ]
    }
    template.children[name] = child
  }

  return template
}

function dynamicForm ({ conf, dkey, mSettings, update, name }) {
  if (!conf.settings) return null

  // Start the form
  const form = [ '### Settings' ]

  // First, inject the enabled setting
  if (typeof conf.settings?.enabled === 'undefined') {
    const val = {
      title: `Enable the ${name} stream processor`,
      dflt: true,
      type: 'list',
      list: [
        {
          val: false,
          label: 'Disabled',
          about: `This completely disables the ${name} stream processor`
        },
        {
          val: true,
          label: 'Enabled',
          about: `Enables the ${name} stream processor`
        },
      ]
    }
    form.push(...dynamicFormSetting('enabled', val, dkey, mSettings, update))
  }

  // Next, inject the topics setting in case it's a simple array
  if (typeof conf.settings?.topics === 'undefined' || Array.isArray(conf.settings?.topics)) {
    const val = {
      title: 'List of topics to subscribe to',
      dflt: conf.settings?.topics || [],
      type: 'labels',
    }
    form.push(...dynamicFormSetting('topics', val, dkey, mSettings, update))
    // Do not show this twice
    if (conf.settings.topics) delete conf.settings.topics
  }

  // Now add the rest of the settings
  for (const [key, val] of Object.entries(conf.settings)) {
    form.push(...dynamicFormSetting(key, val, dkey, mSettings, update))
  }

  return form
}

function dynamicFormSetting (key, val, dkey, mSettings, update) {
  if (val.type === 'list') return dynamicFormListSetting(key, val, dkey, mSettings, update)
  if (val.type === 'labels') return dynamicFormLabelsSetting(key, val, dkey, mSettings, update)
  if (val.type === 'number') return dynamicFormNumberSetting(key, val, dkey, mSettings, update)

  return key ? [`No dynamic form method for ${key}`, <pre key="pre">{JSON.stringify(val, null ,2)}</pre>] : []
}

function dynamicFormListSetting (key, val, dkey, mSettings) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt

  return [
    <h4 className="mt-8" key="title">{val.title}</h4>,
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

function dynamicFormLabelsSetting (key, val, dkey, mSettings) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt
  if (Array.isArray(current)) {
    const newCurrent = {}
    for (const entry of current) newCurrent[entry] = entry
    current = newCurrent
  }

  return [
    <h4 className="mt-8" key="title">{val.title}</h4>,
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

function dynamicFormNumberSetting (key, val, dkey, mSettings) {
  let current = mSettings.tap?.[dkey]?.[key]
  if (current === undefined) current = val.dflt

  return [
    <h4 className="mt-8" key="title">{val.title}</h4>,
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
