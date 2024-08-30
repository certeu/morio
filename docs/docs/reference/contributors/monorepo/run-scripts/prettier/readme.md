---
title: prettier
---

The `prettier` _run script_ runs the [Prettier](https://eslint.org/)
JavaScript code formatter on the _monorepo_.

Run `npm run prettier` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npx prettier --write .
```

The Prettier configuration is held in these files in the _monorepo_:

- <RepoFile>.prettierignore</RepoFile>
- <RepoFile>.prettierrc.json</RepoFile>
