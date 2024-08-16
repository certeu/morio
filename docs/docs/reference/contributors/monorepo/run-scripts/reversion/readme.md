--- 
title: reversion
--- 

The `reversion` _run script_ will prompt for a new version number and apply
that to the _monorepo_.

Run `npm run reversion` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
node scripts/reversion.mjs &&  \
npm run reconfigure
```

In other words, it will first run a script to prompt for the new version,
and update the various configuration files with the new version number. Then
it will run [the `reconfigure` run
script](/docs/reference/contributors/monorepo/run-scripts/reconfigure).

Sample output:

```
The current version is: 0.3.0

Enter a new version number:
```

