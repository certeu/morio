import Joi from 'joi'
import { slugify } from 'lib/utils.mjs'

/*
 * Tokens
 *
 * This holds the configuration wizard view settings for vars/secrets
 */
export const tokens = () => ({
  about: (
    <>
      <p>
        <b>Tokens</b> are helpers to construct your Morio settings. They come in two types,{' '}
        <b>variables</b> and <b>secrets</b>.
      </p>
      <p>
        Both types you can be inserted into your settings using{' '}
        <a href="https://mustache.github.io/" target="_BLANK">
          mustache templates syntax
        </a>
        .
      </p>

      <h4>Variables</h4>
      <p>Variables help keep your settings DRY.</p>
      <p>
        When you find yourself often repeating the same data in your settings, there's no need to
        repeat yourself. Instead, create a variable, and use that instead.
      </p>

      <h4>Secrets</h4>
      <p>Secrets keep sensitive data out of your settings by encrypting them at rest.</p>
      <p>
        This ensures your settings are always safe to backup, and can be kept under version control.
      </p>
    </>
  ),
  title: 'Tokens',
  type: 'info',
  children: {
    secrets: {
      type: 'secrets',
      title: 'Secrets',
    },
    vars: {
      type: 'vars',
      title: 'Variables',
    },
  },
})
