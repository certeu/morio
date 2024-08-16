--- 
title: redev
--- 

The `redev` _run script_ will first __destroy__ the local development
environment, and then set it up again.

Run `npm run redev` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
npm run destroy && \
npm run dev
```

In other words, this has the same effect as 
running [the `destroy` run script](/docs/reference/contributors/monorepo/run-scripts/destroy/), 
followed by 
running [the `dev` run script](/docs/reference/contributors/monorepo/run-scripts/dev/). 

