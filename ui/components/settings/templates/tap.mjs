import Joi from 'joi'
import { Popout } from 'components/popout.mjs'
import { FilterIcon, TrashIcon } from 'components/icons.mjs'

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
 * An input to filter on topics or modules
 */
const filterInput = ({ type, filter, dflt, current }) => {
  const selected = typeof current === 'object'
    ? Object.keys(current).length
    : 0
  let placeholder = filter === 'topics'
    ? `No topics included. Handler will not receive any data`
    : `Module filter disabled (no modules included)`

  if (selected === 1) placeholder = filter === 'topics' ? `One topic included` : `One module included`
  else if (selected > 1) placeholder = filter === 'topics' ? `${selected} topics included` : `${selected} modules included`

  return {
    schema: Joi.object().optional().label(filter),
    key: `tap.builtin.${type}.${filter}`,
    label: `Only invake the handler for these ${filter}`,
    inputType: 'labels',
    labelBL: 'Enter a comma to add a new entry',
    dflt,
    placeholder,
    current,
  }
}

function builtinForm (type, mSettings, update, init) {
  const data = mSettings?.tap?.builtin?.[type] || {}
  const configForm = data.enabled
    ?  handlerConfigForms[type] ? handlerConfigForms[type](data, update) : []
    : [<p>more</p>]
  const title = <h4 className="capitalize">{type} handler</h4>

  const toggle = () => {
    const dflt =(Object.keys(mSettings?.tap?.builtin?.[type] || {}).length > 0)
      ? { ...data, enabled: !data.enabled }
      : init
    update(`tap.builtin.${type}`, dflt)
  }

  if (data.enabled) return [
    title,
    <p>{builtin[type]}</p>,
    ...handlerConfigForms[type](data, update),
    <p className="text-center">
      <button className="btn btn-error btn-outline" onClick={toggle}>Disable the {type} handler</button>
    </p>
  ]

  return [
    title,
    <p>{builtin[type]}</p>,
    <Popout note>
      <h5>The {type} handler is currently disabled</h5>
      <p>Enable it to allow further configuration</p>
      <button className="btn btn-primary" onClick={toggle}>Enable the {type} handler</button>
    </Popout>,
  ]

  const blocks = [
    <h4 className="capitalize">{type} handler</h4>,
    <p>{builtin[type]}</p>,
    enableToggle({
      key: `tap.builtin.${type}.enabled`,
      list: [
        {
          val: false,
          label: 'Disabled'
        },
        {
          val: true,
          label: 'Enabled'
        },
      ]
    }),
    ...configForm,
  ]

  //if (data.enabled && handlerForms[type]) blocks.push(handlerForms[type](data))

  return blocks
}

const builtin = {
  audit: 'Cache audit events, and optionally notify based on conditions you specify.',
  checks: 'The checks Tap handler caches health check data. It will also notify on expiring certificates.',
  inventory: 'The inventory Tap handler builds an inventory based on data reported by Morio clients.',
  metrics: 'The metrics Tap handler caches metrics data. It underpins the UI dashboards using metrics data.',
  logs: 'The log Tap handler Caches log data. It underpins the UI dashboards using logs data.',
}

const handlerConfigForms = {
  audit: (data, update) => ([
    {
      tabs: {
        filters: tapFilters('audit', data, update),
        features: [
          <h4>Cache audit data</h4>,
          enableToggle({
            key: `tap.builtin.audit.cache`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not cache audit data (disable)',
              },
              {
                val: true,
                label: 'Cache recent audit data',
                about: 'Caching audit data allows consulting it through the dashboards provided by Morio&apos;s UI service'
              },
            ],
            current: data.cache === false ? false : true,
          }),
          data.cache === false
            ? <span></span>
            : {
                schema: Joi.number(),
                label: 'Cache TTL in hours',
                key: `tap.builtin.checks.ttl`,
                labelBL: 'How many hours of health check data should be cached?',
                dflt: 60,
                current: data.ttl || 60
              },
          <h4>Eventify audit data</h4>,
          enableToggle({
            label: 'Eventify audit data',
            key: `tap.builtin.audit.eventify`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not eventify audit data (disable)',
              },
              {
                val: true,
                label: 'Auto-create events based on audit data',
                about: 'Eventifying audit data unlocks event-driven automation and monitoring based on audit information',
              },
            ],
            current: data.eventify === false ? false : true,
          }),
        ],
      }
    }
  ]),
  checks: (data, update) => ([
    {
      tabs: {
        filters: tapFilters('checks', data, update),
        features: [
          <h4>Settings</h4>,
          <Popout tip>
            <h5>We recommend generating events from failing health checks</h5>
            <p>
              Receiving an alarm (or notification) for each failing health check can quickly lead to alarm fatigue.
              <br />
              Use one of these options if you are routing Morio&apos; alarms to your own alarm
              handler that provides grouping and supression.
            </p>
            <p>
              If you want Morio to handle grouping and supression for you, go with the
              recommended approach of generating an event for each failing health check,
              and let the events Tap handler handle escalation for you.
            </p>
          </Popout>,
          [
            {
              schema: Joi.string().allow('alarm', 'event', 'notification', 'silent').label('on_down'),
              inputType: 'buttonList',
              label: 'On down',
              key: `tap.builtin.checks.on_down`,
              dflt: true,
              dense: true,
              dir: 'row',
              list: [
                {
                  val: 'alarm',
                  label: 'Alarm',
                },
                {
                  val: 'event',
                  label: 'Event (recommended)',
                },
                {
                  val: 'notification',
                  label: 'Notification',
                },
                {
                  val: 'silent',
                  label: 'Silent (disabled)',
                },
              ],
              current: data.cache === false ? false : true,
            },
            {
              schema: Joi.object().optional().label('up_values'),
              key: `tap.builtin.checks.up_values`,
              label: `Up values`,
              inputType: 'labels',
              labelBL: 'Enter a comma to add a new entry',
              labelTR: 'Add all values that should be considered a success',
              dflt: { up: 'up', 1: 1, green: 'green' },
              current: data.up_values
            },
          ],
          <h4>Cache health check data</h4>,
          enableToggle({
            key: `tap.builtin.checks.cache`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not cache health check data (disable)',
              },
              {
                val: true,
                label: 'Cache recent health check data',
                about: 'Caching health check data allows consulting it through the dashboards provided by Morio&apos;s UI service'
              },
            ],
            current: data.cache === false ? false : true,
          }),
          data.cache === false
            ? <span></span>
            : {
                schema: Joi.number(),
                label: 'Cache TTL in hours',
                key: `tap.builtin.checks.ttl`,
                labelBL: 'How many hours of health check data should be cached?',
                dflt: 1,
                current: data.ttl || 1
              },

          <h4>Verify certificate expiry</h4>,
          enableToggle({
            label: 'Verify certificate expiry',
            key: `tap.builtin.checks.certificate_check`,
            dflt: true,
            list: [
              {
                val: true,
                label: 'Notify when TLS certificates approach their expiration date',
                about: data.on_down === 'event'
                  ? 'Raise an event when certificate expiry drops below a given number of days'
                  : 'Raise a notification or alarm when certificate expiry drops below a given number of days'
              },
              {
                val: false,
                label: 'Do not verify certificate expiry (disable)',
              },
            ],
            current: data.certificate_check === false ? false : true,
          }),
          data.certificate_check === false
            ? <span></span>
            : ['event', 'silent'].includes(data.on_down)
              ? {
                schema: Joi.number(),
                label: 'Certificate event days',
                key: `tap.builtin.checks.certificate_event_days`,
                labelBL: 'How many days before a certificate expires should an event be generated?',
                dflt: 21,
                current: data.certificate_event_days || 15
              } : [
                  {
                    schema: Joi.number(),
                    label: 'Certificate notification days',
                    key: `tap.builtin.checks.certificate_notification_days`,
                    labelBL: 'How many days before a certificate expires should a notification be generated?',
                    dflt: 15,
                    current: data.certificate_notification_days || 15
                  },
                  {
                   schema: Joi.number(),
                    label: 'Certificate alarm days',
                    key: `tap.builtin.checks.certificate_alarm_days`,
                    labelBL: 'How many days before a certificate expires should an alarm be generated?',
                    dflt: 5,
                  }
              ]

        ],
      }
    }
  ]),
  events: (data, update) => ([
    {
      tabs: {
        filters: tapFilters('events', data, update),
        features: [
          <h4>Cache event data</h4>,
          enableToggle({
            key: `tap.builtin.events.cache`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not cache events (disable)',
              },
              {
                val: true,
                label: 'Cache recent events',
                about: 'Caching event data allows consulting it through the dashboards provided by Morio&apos;s UI service'
              },
            ],
            current: data.cache === false ? false : true,
          }),
          data.cache === false
            ? <span></span>
            : {
                schema: Joi.number(),
                label: 'Cache TTL in hours',
                key: `tap.builtin.events.ttl`,
                labelBL: 'How many hours of event data should be cached?',
                dflt: 12,
                current: data.ttl || 12
              },
        ],
      }
    }
  ]),
  inventory: (data, update) => ([
    <Popout note>
      <h5>The inventory handler does not take any configuration</h5>
      <p>You can only enable or disable it.</p>
    </Popout>,
  ]),
  logs: (data, update) => ([
    {
      tabs: {
        filters: tapFilters('logs', data, update),
        features: [
          <h4>Cache log data</h4>,
          enableToggle({
            key: `tap.builtin.logs.cache`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not cache log data (disable)',
              },
              {
                val: true,
                label: 'Cache the most recent log lines for each log file',
                about: "Caching log data allows consulting it through the dashboards provided by Morio&apos;s UI service"
              },
            ],
            current: data.cache === false ? false : true,
          }),
          data.cache === false
            ? <span></span>
            : {
                schema: Joi.number(),
                label: 'Lines',
                key: `tap.builtin.logs.lines`,
                labelBL: 'How many recent log lines to cache per log file?',
                dflt: 1,
                current: data.lines || 25
              },
        ],
      }
    }
  ]),
  metrics: (data, update) => ([
    {
      tabs: {
        filters: tapFilters('metrics', data, update),
        features: [
          <h4>Cache metrics data</h4>,
          enableToggle({
            key: `tap.builtin.metrics.cache`,
            dflt: true,
            list: [
              {
                val: false,
                label: 'Do not cache metrics data (disable)',
              },
              {
                val: true,
                label: 'Cache the most recent metrics data',
                about: "Caching metrics data allows consulting it through the dashboards provided by Morio&apos;s UI service\\\n_**Note**: for supported metricsets only_"
              },
            ],
            current: data.cache === false ? false : true,
          }),
          data.cache === false
            ? <span></span>
            : [
              {
                schema: Joi.number(),
                label: 'TTL',
                labelTR: 'In hours',
                key: `tap.builtin.metrics.ttl`,
                labelBL: 'The number of hours to keep metrics in the cache before expiring them',
                dflt: 1,
                current: data.ttl || 1
              },
              {
                schema: Joi.number(),
                label: 'Cap',
                labelTR: 'In metricsets',
                key: `tap.builtin.metrics.cap`,
                labelBL: 'The maximum number of sets to keep in the cache. This is a hard limit in case the polling interval is low, and TTL is high',
                dflt: 1,
                current: data.ttl || 1
              },
            ]
        ],
      }
    }
  ]),
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
        on_down: 'event',
        certificate_check: true,
        certificate_notification_days: 15,
        certificate_alarm_days: 5,
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
})


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

/**
 * This generates the form for tap filters
 *
 * @param {string} type - The type/id of the tap handler
 * @param {object} data - The current config data
 * @param {function} update - The update method
 * @return {object} form - The form for the UI
 */
function tapFilters (type, data, update) {
  return [
    [
      filterInput({
        type,
        filter: 'topics',
        dflt: asObj(type),
        current: data.topics ? data.topics : asObj(type),
      }),
      filterInput({
        type,
        filter: 'modules',
        dflt: {},
        current: data.modules ? data.modules : false,
      }),
    ],
    data.handler?.filter || data.handler?.filter === ''
      ? {
        schema: Joi.string().label('Filter'),
        key: `tap.builtin.${type}.filter`,
        current: data.filter || '',
        inputType: 'textarea',
        label: 'Filter method',
        labelBL: 'Write a custom JavaScript method to filter data',
        code: true,
        placeholder: tapFilterExample,
        labelTR: (
          <button
            className="btn btn-sm btn-error btn-outline"
            onClick={() => update(`tap.builtin.${type}.filter`, false)}
          >
            <TrashIcon className="w-5 h-5"/>
            Remove custom filter
          </button>
        )
      }
      : (
        <p className="text-right">
          <button
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => update(`tap.builtin.${type}.filter`, '')}
          ><FilterIcon className="w-5 h-5" /> <span>Write a custom filter</span></button>
        </p>
      ),
    data.handler?.filter || data.handler?.filter === ''
    ? (
      <Popout tip>
        <h4>How to write a filter method</h4>
        <p>
          To filter data that is to be passed to a handler, you can provide a custom filter method.
          <br />
          This method will receive the data from Kafka as the only parameter, and should return:
        </p>
        <ul>
          <li><code>true</code> if the data should be passed to the handler for processing</li>
          <li><code>false</code> if the data should be skipped (filtered out)</li>
        </ul>
        <p>Your method will be included in the Tap handler config as such:</p>
        <pre>{`{\n  enabled: ${data.enabled ? 'true' : 'false'},\n  handler: {\n    topics: ${JSON.stringify(data.topics)},\n    filter: YOUR_CUSTOM_FILTER_METHOD_HERE\n  }\n}`}</pre>
        <p>
          Please to keep this in mind and avoid breaking your Tap handler&apos;s configuration.
          <br />
          For example, if you want to include comments, do so inside your function body, and not above it.
        </p>
      </Popout>
    ) : ' ',
  ]
}

