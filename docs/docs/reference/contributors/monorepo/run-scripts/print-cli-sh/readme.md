---
title: print:cli.sh
---

The `print:cli.sh` _run script_ outputs the current CLI variables that you can
retrieve with [the `get` run script](/docs/reference/contributors/monorepo/run-scripts/get/).

It aims to allow you to quickly verify these configuration values from the command line.

Run `npm run print:cli.sh` in the _monorepo_ root to trigger this script.
The output will depend on your local setup, but below is an example:

```sh
  _ _ _  ___  _ _  _  ___
  | ' ' |/ . \| '_/| |/ . \
  |_|_|_|\___/|_|  |_|\___/

The Morio CLI configuration values are as follows:

 - MORIO_GIT_ROOT: /home/jdecock/git/morio
 - MORIO_ABOUT: Morio provides the plumbing for your observability needs
 - MORIO_ASCII_BANNER: (see above)
 - MORIO_AWS_ACCOUNT_ID: 719603448334
 - MORIO_GITHUB_REPO: certeu/morio
 - MORIO_GITHUB_REPO_URL: https://github.com/certeu/morio
 - MORIO_VERSION: 0.3.0
 - MORIO_WEBSITE: morio.it
 - MORIO_WEBSITE_URL: https://morio.it

```

Under the hood, this will run:

```sh title="Terminal"
./scripts/print-cli-config.sh
```

In other words, this runs (Bash) shell, unlike the [print:cli.js run
script](/docs/reference/contributors/monorepo/run-scripts/print-cli-js/), which
uses NodeJS.
