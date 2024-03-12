import Joi from 'joi'
import { slugify } from 'lib/utils.mjs'
// Identity Providers
import { mrt } from './mrt.mjs'
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
        apikeys: {
          title: 'API Keys',
          about: 'Provides authentication with API key/secret',
          desc: 'Use this to pull events from the Amazon Web Services CloudWatch API.',
        },
        ldap: ldap(context),
        local: {
          title: 'Local Accounts',
          about: 'Allows creating and using local Morio accounts',
          desc: 'Use this to pull events from the Amazon Web Services CloudWatch API.',
        },
        mrt: mrt(context),
      },
    },
  },
})
