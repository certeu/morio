---
title: ci:prettier
---

The `ci:prettier` _run script_ runs the [Prettier](https://eslint.org/)
JavaScript code formatter on the _monorepo_.

Run `npm run ci:prettier` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run prettier
```

In other words `npm run ci:prettier` is an alias of `npm run prettier`.
See [prettier](/docs/reference/contributors/monorepo/run-scripts/prettier).
