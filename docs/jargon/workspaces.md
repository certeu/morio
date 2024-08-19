---
title: Workspaces
aliases:
  - workspace
---

__NPM workspaces__ is is a generic term that refers to the set of features in
the [npm cli](https://docs.npmjs.com/cli/v10/) that facilitate handling NodeJS
dependencies inside a monorepo.

For example, both the __core__ and __api__ folders rely on common dependencies.
Rather than installing them twice, through the use of workspaces they will be
installed the monorepo root, and shared.

There is more to workspaces, as it is a somewhat advanced feature of NPM, but
that's not really relevant for Morio. If you want to learn more, refer to [the
NPM documentation on
workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces).


