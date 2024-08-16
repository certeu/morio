--- 
title: prebuild
--- 

The `prebuild` _run script_ will run housekeeping to ensure everything is ready
to build container images for local development.

Run `npm run build:prebuild` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run reconfigure
```

In other words `npm run prebuild` is an alias of `npm run reconfigure`.
See [reconfigure](/docs/reference/contributors/monorepo/run-scripts/reconfigure).

## Side-effects of pre and post run scripts

A feature of [NPM run
scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts) is that for a run
script `x` they will automatically trigger the run script `prex` before 
and `postx` after running `x`. But only if `prex` and/or `postx` exist of course.

In other words, when you run `npm run build`, this will run first, then [the
build run script](/docs/reference/contributors/monorepo/run-scripts/build/)
will run.

