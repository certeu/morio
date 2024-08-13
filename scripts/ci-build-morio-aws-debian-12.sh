#!/bin/bash
#
# This script will build the AMI image for moriod
# It is created for a CI environment, but should also run fine
# on a system that has Hashicorp Packer installed.
#
# When running this locally, make sure to set the following
# environment variables:
#
#  - AWS_ACCESS_KEY_ID
#  - AWS_SECRET_ACCESS_KEY
#

#
# Figure out the repository root
#
REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

#
# Grab the version and export it as it's used in the packer config
#
cd $REPO
export MORIO_VERSION=$(npm run -s get version)
echo "Morio version is $MORIO_VERSION"

#
# Make sure we are in the repo, then run packer
#
cd $REPO/packer
packer init aws-debian-12.pkr.hcl
packer build aws-debian-12.pkr.hcl
