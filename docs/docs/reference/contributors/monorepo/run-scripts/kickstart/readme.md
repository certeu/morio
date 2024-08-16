--- 
title: kickstart
---

The `kickstart` _run script_ installs NodeJS dependencies, and sets up the _monorepo_.  
It is typically the first thing you run after cloning the repository.

Run `npm run kickstart` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm install && \
npm install --global husky && \
husky install && \
npm run prebuild 
```

As you can see, it does a bit more than installing dependencies:

- `npm install`: Installs dependencies
- `npm install --global husky`: (globally) Installs [husky](https://typicode.github.io/husky/), which provides git hooks
- `husky install`: Sets up the git precommit hook that will run [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) on changed files.
- `npm run prebuild`: Triggers [the `prebuild` run script](/docs/reference/contributors/monorepo/run-scripts/prebuild)

In other words, this does everything needed to _kickstart_ your Morio development.
