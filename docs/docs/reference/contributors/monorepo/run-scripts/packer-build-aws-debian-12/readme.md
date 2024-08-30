---
title: packer:build.aws.debian-12
---

The `packer:build.aws.debian-12` _run script_ builds a
Debian 12 (bookworm) AMI image on AWS in accordance with
the [Hashicorp Packer](https://packer.io/) configuration
stored at <RepoFile>packer/aws-debian-12.pkr.hcl</RepoFile>
in the _monorepo_.

Run `npm run packer:build` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
packer build packer
```

As such, it will run packer for all configurations stored in the `packer`
folder of the _monorepo_.
k
