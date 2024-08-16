--- 
title: destroy
---

The `destroy` _run script_ destroys the local development environment.
It stops and removes all containers, and removes all data created by them.

Run `npm run destroy` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/destroy.sh
```

