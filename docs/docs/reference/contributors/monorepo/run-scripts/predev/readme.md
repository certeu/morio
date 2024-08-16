--- 
title: predev
--- 

The `predev` _run script_ will run housekeeping to ensure everything is ready
to set up the local development environment.

Run `npm run build:predev` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run reconfigure
```

In other words `npm run predev` is an alias of `npm run reconfigure`.
See [reconfigure](/docs/reference/contributors/monorepo/run-scripts/reconfigure).

## Side-effects of pre and post run scripts

A feature of [NPM run
scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts) is that for a run
script `x` they will automatically trigger the run script `prex` before 
and `postx` after running `x`. But only if `prex` and/or `postx` exist of course.

In other words, when you run `npm run dev`, this will run first, then [the
dev run script](/docs/reference/contributors/monorepo/run-scripts/dev/)
will run.

