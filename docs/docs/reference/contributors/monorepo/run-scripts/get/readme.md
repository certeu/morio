---
title: get
---

The `get` _run script_ facilitates access to Morio configuration data
-- stored in JavaScript files -- from shell scripts.

Run `npm run get` in the _monorepo_ root to trigger this script.
The output will be as follows:

```sh
   _ _ _  ___  _ _  _  ___
  | ' ' |/ . \| '_/| |/ . \
  |_|_|_|\___/|_|  |_|\___/

This is a helper to bridge the gap between your shell and NodeJS.

Specifically, you can call this from a shell and pass command-line parameters
to get certain data from JS in your shell scripts.

To run this, call it from node. For example (from the repo root):

node shared/src/cli-get.mjs MORIO_ASCII_BANNER

You can also run this as an NPM run-script, but make sure to pass -s to silence the npm output:

npm run -s get MORIO_ASCII_BANNER

Arguments:

  help                      Show this help

  moriod-deb-control        Outputs the content of the .deb control file
  moriod-rpm-spec           Outputs the content of the .rpm spec file
  moriod-moriod-env         Outputs the content of the moriod.env file for the moriod package
  moriod-version-env        Outputs the content of the version.env file for the moriod package

  MORIO_ASCII_BANNER        Output the MORIO_ASCII_BANNER CLI variable
  MORIO_ABOUT               Output the MORIO_ABOUT CLI variable
  MORIO_AWS_ACCOUNT_ID      Output the MORIO_AWS_ACCOUNT_ID CLI variable
  MORIO_GIT_ROOT            Output the MORIO_GIT_ROOT CLI variable
  MORIO_GITHUB_REPO         Output the MORIO_GITHUB_REPO CLI variable
  MORIO_GITHUB_REPO_URL     Output the MORIO_GITHUB_REPO_URL CLI variable
  MORIO_VERSION             Output the MORIO_VERSION CLI variable
  MORIO_WEBSITE             Output the MORIO_WEBSITE CLI variable
  MORIO_WEBSITE_URL         Output the MORIO_WEBSITE_URL CLI variable

Note that the CLI variables can also be loaded by sourcing the cli config:

source config/cli.sh
```

Under the hood, this will run:

```sh title="Terminal"
node --no-warnings shared/src/cli-get.mjs
```

Refer to the output above for more details or run `npm run get` in the _monorepo_ root.
