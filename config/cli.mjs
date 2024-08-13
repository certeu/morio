import { pkg } from './json-loader.mjs'
import path from 'path'

/*
 * A little helper file with named exports to get access to a bunch of configurartion values.
 *
 * This provides the following named exports:
 *
 *  - MORIO_ASCII_BANNER
 *  - MORIO_ABOUT
 *  - MORIO_AWS_ACCOUNT_ID
 *  - MORIO_GIT_ROOT
 *  - MORIO_GITHUB_REPO
 *  - MORIO_GITHUB_REPO_URL
 *  - MORIO_VERSION
 *  - MORIO_WEBSITE
 *  - MORIO_WEBSITE_URL
 */

/*
 * About Morio
 */
export const MORIO_ABOUT = "Morio provides the plumbing for your observability needs"

/*
 * Ascii banner
 */
export const MORIO_ASCII_BANNER = `

  ._ _ _  ___  _ _  _  ___
  | ' ' |/ . \\| '_/| |/ . \\
  |_|_|_|\\___/|_|  |_|\\___/
`

/*
 * AWS account id (for AMI ownership)
 */
export const MORIO_AWS_ACCOUNT_ID = '719603448334'

/*
 * Location of the git repository on disk
 */
export const MORIO_GIT_ROOT = path.resolve(path.basename(import.meta.url), '..')

/*
 * Morio repository
 */
export const MORIO_GITHUB_REPO = 'certeu/morio'
export const MORIO_GITHUB_REPO_URL = 'https://github.com/certeu/morio'

/*
 * Morio version
 */
export const MORIO_VERSION = pkg.version

/*
 * Morio website
 */
export const MORIO_WEBSITE = 'morio.it'
export const MORIO_WEBSITE_URL = 'https://morio.it'



