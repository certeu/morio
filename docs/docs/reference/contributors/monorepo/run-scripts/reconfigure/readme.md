---
title: reconfigure
---

The `reconfigure` _run script_ will run a variety of housekeeping task
to ensure the monorepo is correctly set up.

Run `npm run reconfigure` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
node scripts/reconfigure.mjs
```

The main task of this script to to create the scripts to launch the
_core service_ container for local development. For that to work, we
map the local git repository into the container.
Since the path to the local git repository can be different on
every contributor's machine, we need to generate this script dynamically.

<Tip>
#### This run script is idempotent

It is safe to run this script more than once without compounding effects.
</Tip>
