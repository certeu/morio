import Joi from 'joi'
import { Popout } from 'components/popout.mjs'
import { TipIcon, BoolNoIcon, BoolYesIcon, CertificateIcon, PuzzleIcon } from 'components/icons.mjs'

/*
 * Cluster
 *
 * This holds the configuration wizard view settings
 * for the Morio deployment, which are high-level settings.
 * These are not about how to configure individual components,
 * but rather about how everything should work together
 *
 * When running the initial setup, these are the only choices
 * the user should make. So you can also think of this as the
 * setup template.
 */
export const cluster = (...params) => {
  const template = {
    title: 'Cluster Setup',
    type: 'info',
    lockOnEdit: true,
    children: {
      setup: {
        type: 'form',
        lockOnEdit: true,
        title: 'Morio Deployment',
        form: [
          {
            linearTabs: true,
            setupOnly: true,
            tabs: {
              Sizing: sizingTab(...params),
              Names: namesTab(...params),
              Cluster: clusterTab(...params),
              Optional: optTab(...params),
              Validate: validateTab(...params),
            },
          },
        ],
      },
    },
  }

  const [context, toggleValidate] = params
  if (!context?.TMP?.node_count || context?.TMP?.node_count < 2) {
    delete template.children.setup.form[0].tabs.Cluster
  }
  if (!toggleValidate) delete template.children.setup.form[0].tabs['Validate Settings']
  if (context?.version) {
    delete template.children.setup.form
    template.children.setup.type = 'mdx'
    template.children.setup.mdx = [
      '### Morio Deployment',
      'These settings cannot be changed. You can review the current settings at [/settings/show](/settings/show).',
    ]
  }

  return template
}

function sizingTab () {
  return [
    `### Choose your deployment size`,
    {
      key: 'TMP.node_count',
      schema: Joi.number().valid(1, 3, 5, 7, 9).required().label('Node Count'),
      inputType: 'buttonList',
      title: 'Node vs Cluster',
      lockOnEdit: true,
      list: [
        {
          val: 1,
          label: 'Morio Standalone Deployment',
          about: `
- Setup a standalone Morio node
- Recommended for small deployments
- Provides a simpler setup with less moving parts
`,
    },
    {
      val: 3,
      label: 'Morio Clustered Deployment',
      about: `
- Setup a Morio cluster with 3 broker nodes
- Recommended for larger deployments
- Provides high availibility
`,
    },
    {
      label: 'Morio Large Cluster Deployment',
      about: `
- Setup a Morio cluster with 5, 7, or 9 broker nodes
- Recommended for increased throughput
- Size matters, but bigger is not always better
`,
            hide: 'Show larger cluster sizes',
            val: {
              type: 'select',
              values: [5, 7, 9],
              labels: ['5 broker nodes', '7 broker nodes', '9 broker nodes'],
              label: 'Cluster nodes',
              about: 'Choose the amount of broker nodes in the Morio cluster',
            },
          },
        ],
      },
    ]
}

function namesTab (context) {
  return [
    '### Name your Morio deployment',
    '##### A global display name for this Morio deployment',
    {
      key: 'cluster.name',
      schema: Joi.string().required().label('Display Name'),
      label: 'Display Name',
      labelBL: 'A human-friendly name to refer to this Morio setup',
      lockOnEdit: true,
      placeholder: 'Morio Production',
    },
    '&nbsp;',
    '##### DNS names for the nodes in this deployment',
  ].concat(
    context?.TMP?.node_count
      ? [...Array(context.TMP?.node_count || 0)].map((un, i) => ({
          key: `cluster.broker_nodes.${i}`,
          label: `Node ${i + 1} FQDN`,
          labelBL: `Enter the fully qualified domain name of node ${i + 1}`,
          placeholder: `morio-node${i + 1}.my.domain.com`,
          lockOnEdit: true,
          schema: Joi.string().hostname().required().label('FQDN'),
        }))
      : [
          <Popout tip key={1}>
            <h5>You need to choose a cluster size first</h5>
            <p>
              Once you have chosen a cluster size, you can enter the node names here.
            </p>
          </Popout>,
        ]
  )
}

function clusterTab() {
  return [
    '### Cluster settings',
    '##### Cluster Name',
    'This name should resolve to the IP addresses of all cluster nodes.',
    {
      key: 'cluster.fqdn',
      label: 'Cluser Name',
      labelBL: 'A fully qualified domain name for the entire Morio cluster',
      labelBR: (
        <span className="italic opacity-70">
          Create a round-robin A record for this
        </span>
      ),
      schema: Joi.string().hostname().required().label('Cluster Name'),
    },
  ]
}

function optMorioHubTab(context) {
  const withMoriohub = [
    [
      {
        key: 'TMP.moriohub_modules',
        schema: Joi.bool().label('Moriohub Client Modules'),
        inputType: 'buttonList',
        title: 'Node vs Cluster',
        dense: true,
        dir: 'row',
        current: true,
        activeIcon:
          context.TMP?.moriohub_modules === false ? (
            <BoolNoIcon size={6} />
          ) : (
            <BoolYesIcon size={6} />
          ),
        list: [
          {
            val: true,
            label: 'Yes',
          },
          {
            val: false,
            label: 'No',
          },
        ],
      },
      {
        div: true,
        className: "mt-2 ml-2",
        form: [
          <>
            <b>Load Morio client modules</b>
            <br />
            <small>Configuration modules for the various agents</small>
          </>
        ],
      },
      {
        key: 'TMP.moriohub_dashboarding',
        schema: Joi.bool().label('Moriohub Live Dashboarding'),
        inputType: 'buttonList',
        dir: 'row',
        dense: true,
        activeIcon:
          context.TMP?.moriohub_dashboarding === false ? (
            <BoolNoIcon size={6} />
          ) : (
            <BoolYesIcon size={6} />
          ),
        current: true,
        list: [
          {
            val: true,
            label: 'Yes',
          },
          {
            val: false,
            label: 'No',
          },
        ],
      },
      {
        div: true,
        className: "mt-2 ml-2",
        form: [
          <>
            <b>Add support for live dashboarding</b>
            <br />
            <small>Adds visualisation logic and stream processors</small>
          </>
        ],
      },
    ],
  ]

  return [
    [
      {
        key: 'TMP.moriohub',
        schema: Joi.bool().label('MorioHub Integration'),
        inputType: 'buttonList',
        title: 'MorioHub',
        lockOnEdit: true,
        dir: 'row',
        current: false,
        dense: true,
        activeIcon: context.TMP?.moriohub ? (
          <BoolYesIcon size={6} />
        ) : (
          <BoolNoIcon size={6} />
        ),
        list: [
          {
            val: true,
            label: 'Yes',
          },
          {
            val: false,
            label: 'No',
          },
        ],
      },
      {
        div: true,
        className: "mt-2 ml-2",
        form: [
          <>
            <b>Enable MorioHub integration</b>
            <br />
              <small>Disabled by default, but highly recommended</small>
          </>
        ],
      },
    ],
  ].concat(context.TMP?.moriohub ? withMoriohub : [])
  .concat([
    <Popout tip key="tip">
      <h5>No need to re-invent the observability wheel</h5>
      <p>
        <a href="https://morio.it/hub/" target="_BLANK">
          MorioHub
        </a>{' '}
        is a curated collection of Morio configuration and plugins for various use
        cases.
      </p>
    </Popout>,
  ])

}

function validateTab(context, toggleValidate) {
  return [
    '### Pre-flight check: All systems go?',
    'Before we deploy Morio using these settings, we will run a series of validation tests.',
    'No changes will be made at this time. Click below to start the tests.',
    <p className="text-center" key={1}>
      <button className="btn btn-primary btn-lg px-12 mt-4" onClick={toggleValidate}>
        Validate Morio Settings
      </button>
    </p>,
  ]
}

function optTab (...params) {
  return [
    '### Optional settings',
    {
      details: true,
      summary: <h4>Certificate Authority</h4>,
      form: optCaTab(...params),
    },
    {
      details: true,
      summary: <h4>Import Key Data</h4>,
      form: optKeydataTab(...params),
    },
    {
      details: true,
      summary: <h4>MorioHub Integration</h4>,
      form: optMorioHubTab(...params),
    },
  ]
}

function optKeydataTab (context) {
  if (context.preseed?.keys?.data) return [<Popout tip title="Key Data file Loaded" compact key="a" />]

  return [
    {
      key: 'preseed.keys',
      label: 'Key Data file (JSON)',
      schema: Joi.object({
        data: Joi.string().required(),
        key: Joi.string().required(),
        seal: Joi.object({
          hash: Joi.string().required(),
          salt: Joi.string().required(),
        }),
      }),
      inputType: 'file',
      original: undefined,
      dropzoneConfig: {
        accept: { 'application/json': ['.json'] },
        maxFiles: 1,
        multiple: false,
      },
      transform: (upload) => {
        let data
        try {
          const chunks = upload.split(',')
          data = JSON.parse(atob(chunks[1]))
        } catch (err) {
          data = {}
        }

        return data
      },
    },
    <Popout tip key="c">
      <h5>What is a Key Data file?</h5>
      <p>
        If you provide a Key Data file here that you exported from another Morio
        instance, this Morio instance will be set up with the same cryptographic
        DNA.
        <br />
        This allows running Morio in a blue/green deployment.
      </p>
    </Popout>,
  ]
}

function optCaTab (context) {
  const subit = context?.subca?.enable ? true : false

  return [
    {
      key: 'subca.enable',
      schema: Joi.bool().label('Morio CA'),
      inputType: 'buttonList',
      title: 'Node vs Cluster',
      current: false,
      activeIcon: subit
        ? <PuzzleIcon className="w-b -w-8" />
        : <CertificateIcon className="w-b w-8" />,
      list: [
        {
          val: false,
          label: 'Create an independent Certificate Authority',
          about: context?.subca?.enable ? false : (
            <>
              Set up Morio as a stand-alone Certificate Authority (CA)
              <ul className="list list-inside list-disc text-small ml-2 mt-1">
                <li>Easiest setup</li>
                <li>To avoid certificate warnings, add Morio&apos;s CA to your clients&apos; trust store</li>
              </ul>
            </>
          ),
        },
        {
          val: true,
          label: 'Create a subordinate Certificate Authority',
          about: (
            <>
              Set up Morio as a subordinate to an existing Certificate Authority (CA)
              <ul className="list list-inside list-disc text-small ml-2 mt-1">
                <li>More setup steps</li>
                <li>Can benefit from existing trust in your organisation</li>
              </ul>
            </>
          ),
        },
      ],
    },
    '##### Certificate Authority Properties',
    <div className="text-success text-sm flex flex-row items-center gap-1" key="tip">
      <TipIcon className="w-5 h-5"/>
      <em>
      Feel free to leave these fields empty (or lie), since they are cosmetic only
      </em>
    </div>,
    {
      div: true,
      className: "grid grid-cols-3 gap-2 w-full",
      form: [
        {
          key: `subca.c`,
          label: `C`,
          labelBL: `Country`,
          placeholder: `Belgium`,
          schema: Joi.string().label('Country').allow(''),
        },
        {
          key: `subca.st`,
          label: 'ST',
          labelBL: `State (or Region)`,
          placeholder: `Brussels`,
          schema: Joi.string().label('State').allow(''),
        },
        {
          key: `subca.l`,
          label: `L`,
          labelBL: 'Locality (City)',
          placeholder: `Brussels`,
          schema: Joi.string().label('City').allow(''),
        },
      ]
    },
    {
      div: true,
      className: "grid grid-cols-2 gap-2 w-full -mt-6",
      form: [
        {
          key: `subca.o`,
          label: 'O',
          labelBL: `Organisation`,
          placeholder: `CERT-EU`,
          schema: Joi.string().label('Organisation').allow(''),
        },
        {
          key: `subca.ou`,
          label: 'OU',
          labelBL: `Organisational Unit (Department)`,
          placeholder: `Infrastructure Team`,
          schema: Joi.string().label('Country').allow(''),
        },
      ],
    },
    {
      div: true,
      className: "grid grid-cols-2 gap-2 w-full -mt-6",
      form: [
        {
          key: `subca.rcn`,
          label: `Root CN`,
          labelBL: 'Common Name (Name) for the root certificate',
          placeholder: `Morio Root Certificate Authority`,
          schema: Joi.string().label('Country').allow(''),
        },
        {
          key: `subca.icn`,
          label: `Intermediate CN`,
          labelBL: 'Common Name for the intermediate certificate',
          placeholder: `Morio Intermediate Certificate Authority`,
          schema: Joi.string().label('Country').allow(''),
        },
      ]
    },
    <Popout tip key="c">
      <h5>Can you trust the Morio Certificate Authority?</h5>
      <p>
        Morio relies on <a
        href="https://en.wikipedia.org/wiki/X.509">X.509 certificates</a> for
        both <b>encryption</b> and <b>authentication</b>.
        Whether you should also trust its CA is <a
          href="https://morio.it/docs/guides/services/ca/#can-you-trust-the-morio-certificate-authority">
          a different matter altogether
        </a>.
      </p>
    </Popout>
  ]
}

