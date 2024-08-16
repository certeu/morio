--- 
title: packer:fmt
---

The `packer:fmt` _run script_ formats all 
[Hashicorp Packer](https://packer.io/) configurations.

Run `npm run packer:fmt` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
packer fmt packer
```

As such, it will run `packer fmt` for all configurations stored in 
the <RepoFile>packer</RepoFile> folder of the _monorepo_.
As Packer's `fmt` command formats the `.hcl` configuration, this will
format all of them.

