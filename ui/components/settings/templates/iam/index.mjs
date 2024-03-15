import Joi from 'joi'
import { slugify } from 'lib/utils.mjs'
// Identity Providers
import { mrt } from './mrt.mjs'
import { apikey } from './apikey.mjs'
import { local } from './local.mjs'
import { ldap } from './ldap.mjs'

/*
 * Reuse this for the provider ID
 */
export const providerMeta = () => [
  [
    {
      schema: Joi.string().invalid('mrt').required().label('ID'),
      label: 'ID',
      labelBL: `A unique ID to reference this provider`,
      labelBR: <span className="italic opacity-70">Input will be slugified</span>,
      key: 'id',
      transform: slugify,
    },
    {
      schema: Joi.string().required().label('Label'),
      label: 'Label',
      labelBL: `A label to identify this provider on the login screen`,
      key: 'label',
    },
  ],
  {
    schema: Joi.string().optional().allow('').label('Description'),
    label: 'Description',
    labelBL: `A description to help understand the purpose of this provider`,
    labelBR: <span className="italic opacity-70">Optional</span>,
    key: 'about',
    inputType: 'textarea',
  },
]

/*
 * Resuse this for visibility
 */
export const providerVisibility = ({ name }) => ({
  key: 'visibility',
  schema: Joi.string().valid('tab', 'icon', 'disabled').required().label('Visibilty'),
  inputType: 'buttonList',
  title: 'Visibility',
  label: 'Visibility',
  current: 'tab',
  list: [
    {
      val: 'tab',
      label: 'Display as any other provider',
      about: `Include the ${narm} provider in the list of availble identity providers`,
    },
    {
      val: 'icon',
      label: 'Display as an icon only',
      about: `Do not include the ${name} provider in the list of availble identity providers, instead display an icon to bring it up`,
    },
    {
      val: 'disabled',
      label: 'Do not display',
      about: `Do not show the ${name} identity provider on the login screen at all`,
    },
  ],
})

/*
 * Identity and Access Management (IAM)
 */
export const iam = (context) => ({
  about: (
    <>
      IAM covers <b>Identity and Access Management</b>. It allows you to setup various
      authenntication providers to prove <b>identity</b> -- as well as configure{' '}
      <b>authorization</b> rules about who can access what within this Morio deploymnent.
    </>
  ),
  title: 'IAM',
  type: 'info',
  children: {
    /*
     * Identity providers
     */
    providers: {
      type: 'authProviders',
      title: 'Identity Providers',
      about: 'Identity providers are services that allow users to prove their identity',
      blocks: {
        apikey: apikey(context),
        ldap: ldap(context),
        local: local(context),
        mrt: mrt(context),
      },
    },
    /*
     * Login form
     */
    ui: {
      label: 'Login Page',
      title: 'Login Page',
      type: 'loginUi',
    },
  },
})
