--- 
title: ci:eslint
---

The `ci:eslint` _run script_ runs the [ESLint](https://eslint.org/)
JavaScript linter on the _monorepo_.

Run `npm run ci:eslint` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run lint
```

In other words `npm run ci:eslint` is an alias of `npm run lint`.
See [lint](/docs/reference/contributors/monorepo/run-scripts/lint).

