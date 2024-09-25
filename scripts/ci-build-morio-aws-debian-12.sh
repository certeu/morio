#!/usr/bin/env bash
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

# Sounce config variables
source config/cli.sh

#
# Make sure we are in the repo, then run packer
#
cd $MORIO_GIT_ROOT/packer
packer init aws-debian-12.pkr.hcl
packer build --var "morio_version=$MORIO_VERSION" aws-debian-12.pkr.hcl
