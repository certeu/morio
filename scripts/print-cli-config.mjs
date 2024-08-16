import {
  MORIO_ASCII_BANNER,
  MORIO_ABOUT,
  MORIO_AWS_ACCOUNT_ID,
  MORIO_GIT_ROOT,
  MORIO_GITHUB_REPO,
  MORIO_GITHUB_REPO_URL,
  MORIO_VERSION,
  MORIO_WEBSITE,
  MORIO_WEBSITE_URL,
} from '../config/cli.mjs'

const vars = {
  MORIO_ABOUT,
  MORIO_AWS_ACCOUNT_ID,
  MORIO_GIT_ROOT,
  MORIO_GITHUB_REPO,
  MORIO_GITHUB_REPO_URL,
  MORIO_VERSION,
  MORIO_WEBSITE,
  MORIO_WEBSITE_URL,
}
console.log(MORIO_ASCII_BANNER)
console.log(`
The Morio CLI configuration values are as follows:
`)
for (const [name, val] of Object.entries(vars)) console.log(`  - ${name}: ${val}`)
console.log()
