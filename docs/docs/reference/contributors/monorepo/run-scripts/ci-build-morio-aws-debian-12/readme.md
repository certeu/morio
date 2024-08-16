--- 
title: ci:build.morio.aws.debian-12
---

The `ci:build.morio.aws.debian-12` _run script_ builds a Debian-12 based AMI
image for Morio on AWS. It uses [Hashicorp Packer](https://www.packer.io/) to do so.

Run `npm run ci:build.morio.aws.debian-12` in the _monorepo_ root to trigger this script.

Under the hood, this will run:

```sh title="Terminal"
./scripts/ci-build-morio-aws-debian-12.sh
```

## Prerequisites

This script typically runs in CI, but it can be ran locally as long as you make
sure that Hashicorp Packer is available, and the the following environment
variables are set:

| Name | Description |
| ----:| ----------- |
| `AWS_ACCESS_KEY_ID` | The key ID for access to [AWS][aws] |
| `AWS_SECRET_ACCESS_KEY` | The secret for access to [AWS][aws] |

This will create an EC2 instance as well as supporting resources to build the AMI on.
When everything is done, those resources will be destroyed again.

Refer to [the Packer
documentation](https://developer.hashicorp.com/packer/integrations/hashicorp/amazon)
for more details.

[aws]: https://aws.amazon.com/
