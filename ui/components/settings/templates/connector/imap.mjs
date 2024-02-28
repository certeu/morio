import Joi from 'joi'
import { xputMeta } from './index.mjs'

/*
 * IMAP input & output Connector templates
 */
export const imap = {
  in: (context) => ({
    title: 'IMAP',
    about: 'Reads mail from an IMAP server',
    desc: 'Use this to read incoming email from a mail server over IMAP',
    local: (data) => `connector.inputs.${data.id}`,
    btn: 'Create IMAP Input',
    form: [
      `##### Create a new IMAP connector input`,
      {
        tabs: {
          Metadata: xputMeta('input', 'imap'),
          Settings: [
            [
              {
                schema: Joi.string().hostname().required().label('IMAP Host'),
                label: 'IMAP Host',
                labelBL: 'The IMAP server to connect to',
                key: 'host',
              },
              {
                schema: Joi.number().required().label('IMAP Port'),
                label: 'IMAP Port',
                labelBL: 'The port the IMAP server listens on',
                key: 'port',
              },
            ],
            [
              {
                schema: Joi.string().required().label('Username'),
                label: 'Username',
                labelBL: 'The username to access the IMAP server',
                key: 'user',
              },
              {
                schema: Joi.string().required().label('Password'),
                inputType: 'password',
                label: 'Password',
                labelBL: 'The password to access the IMAP server',
                key: 'enc|password',
              },
            ],
            [
              {
                schema: Joi.string().default('INBOX').label('Folder'),
                label: 'Folder',
                labelBL: 'The folder from which to fetch messages',
                key: 'folder',
                dflt: 'INBOX',
              },
              {
                schema: Joi.boolean().default(false).label('Delete Messages'),
                label: 'Delete Messages',
                labelBL: 'Whether to delete messages we fetch',
                list: [true, false],
                labels: ['Yes', 'No'],
                dflt: false,
                key: 'delete',
              },
            ],
          ],
          Advanced: [
            [
              {
                schema: Joi.number().default(300).label('Check Interval'),
                label: 'Check Interval',
                labelBL:
                  'This amount in seconds controls the interval at which we check for new messages',
                placeholder: 300,
                dflt: 300,
                key: 'check_interval',
              },
              {
                schema: Joi.number().default(50).label('Fetch Count'),
                label: 'Fetch Count',
                labelBL: 'Number of messages to fetch in one batch',
                placeholder: 50,
                dflt: 50,
                key: 'fetch_count',
              },
            ],
            [
              {
                schema: Joi.boolean().default(true).label('Use TLS'),
                label: 'Use TLS',
                labelBL: 'Whether to encrypt the connection to the IMAP server',
                key: 'secure',
                dflt: true,
              },
              {
                schema: Joi.boolean().default(true).label('Verify Certificate'),
                label: 'Verify Certificate',
                labelBL: 'Whether to enforce validation of the certificate chain',
                key: 'verify_cert',
                dflt: true,
              },
            ],
          ],
        },
      },
    ],
  }),
}
