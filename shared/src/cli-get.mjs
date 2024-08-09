import process from 'node:process'

/*
 * This is not supposed to be caled inside a JS project
 * but rather from the command line
 */
import { banner, repo, repoUrl, website, websiteUrl } from  '../../config/cli.mjs'
import { deb, version } from '../../config/moriod.mjs'

const showHelp = () => console.log(`
${banner}
This is a helper to bridge the gap between your shell and NodeJS.

Speficially, you can call this from a shell and pass command-line paratmers
to get certain data from JS in your shell scripts.

To run this, call it from node. For example (from the repo root):

node shared/src/cli-get.mjs banner

You can also run this as an NPM run-script, but make sure to pass -s to silence the npm output:

npm run -s get banner

Arguments:

  help                                Show this help
  version                             Output the morio version
  banner                              Output the morio ASCII banner
  repo                                Output the morio git org/repo name
  repo-url                            Output the URL to the morio repository
  website                             Output the morio website
  website-url                         Output the URL to the morio website

  moriod-deb-control                  Outputs the content of the .deb control file
  moriod-deb-version                  Outputs the morio version (alias of version)
  moriod-deb-version-env              Outputs the content of the version.env file for the moriod .deb pacakge
`)

/*
 * Map CLI flag to the variable to output
 */
const cliParamToVar = {
  "banner": banner,
  "moriod-deb-control": deb.control,
  "moriod-deb-version": version,
  "moriod-deb-version-env": deb.control,
  "repo": repo,
  "repo-url": repoUrl,
  "version": version,
  "website": website,
  "website-url": websiteUrl,
}


/*
 * Allow this to be called from a shell script with parameters
 */
if (process.argv[2]) {
  const key = process.argv[2].toLowerCase()
  if (Object.keys(cliParamToVar).includes(key)) console.log(cliParamToVar[key])
  /*
  else {
    switch (process.argv[2].toLowerCase()) {
      case 'moriod-deb-control-file':
        console.log(deb.control.file(process.argv[3]))
        break;
      default:
        showHelp()
    }
  }
  */
} else showHelp()