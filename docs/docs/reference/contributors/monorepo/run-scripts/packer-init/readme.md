--- 
title: packer:init
---

The `packer:init` _run script_ will initialise all 
[Hashicorp Packer](https://packer.io/) configurations, and install
all their required Packer plugins.

Run `npm run packer:init` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
packer init packer
```

As such, it will run `packer init` for all configurations stored in 
the <RepoFile>packer</RepoFile> folder of the _monorepo_.
As Packer's `init` command installs required plugins, this will
format all of them.

