import process from 'node:process'

/*
 * This is not supposed to be called inside a JS project
 * but rather from the command line
 */
import {
  MORIO_ASCII_BANNER,
  MORIO_ABOUT,
  MORIO_GIT_ROOT,
  MORIO_GITHUB_REPO,
  MORIO_GITHUB_REPO_URL,
  MORIO_VERSION,
  MORIO_WEBSITE,
  MORIO_WEBSITE_URL,
} from '../../config/cli.mjs'

function showHelp() {
  console.log(`
${MORIO_ASCII_BANNER}
This is a helper to bridge the gap between your shell and NodeJS.

Specifically, you can call this from a shell and pass command-line parameters
to get certain data from JS in your shell scripts.

To run this, call it from node. For example (from the repo root):

node shared/src/cli-get.mjs MORIO_ASCII_BANNER

You can also run this as an NPM run-script, but make sure to pass -s to silence the npm output:

npm run -s get MORIO_ASCII_BANNER

Arguments:

  help                      Show this help

  MORIO_ASCII_BANNER        Output the MORIO_ASCII_BANNER CLI variable
  MORIO_ABOUT               Output the MORIO_ABOUT CLI variable
  MORIO_GIT_ROOT            Output the MORIO_GIT_ROOT CLI variable
  MORIO_GITHUB_REPO         Output the MORIO_GITHUB_REPO CLI variable
  MORIO_GITHUB_REPO_URL     Output the MORIO_GITHUB_REPO_URL CLI variable
  MORIO_VERSION             Output the MORIO_VERSION CLI variable
  MORIO_WEBSITE             Output the MORIO_WEBSITE CLI variable
  MORIO_WEBSITE_URL         Output the MORIO_WEBSITE_URL CLI variable

Note that the CLI variables can also be loaded by sourcing the cli config:

source config/cli.sh
`)
}

/*
 * Map CLI flag to the variable to output
 */
const cliParamToVar = {
  MORIO_ASCII_BANNER,
  MORIO_ABOUT,
  MORIO_GIT_ROOT,
  MORIO_GITHUB_REPO,
  MORIO_GITHUB_REPO_URL,
  MORIO_VERSION,
  MORIO_WEBSITE,
  MORIO_WEBSITE_URL,
}

/*
 * Allow this to be called from a shell script with parameters
 */
if (process.argv[2]) {
  const key = process.argv[2].toLowerCase()
  if (Object.keys(cliParamToVar).includes(key)) console.log(cliParamToVar[key])
  else showHelp()
} else showHelp()
