#!/usr/bin/env bash
#
# This script will build the .rpm package for moriod inside a rockylinux:9 container
# This allows you to build the .rpm package on a non-rpm Linux distro.
#

# Sounce config variables
source config/cli.sh

#
# Run CI script inside the rockylinux container
#
docker run --rm --name=moriod-rpm-builder -v $MORIO_GIT_ROOT:/morio rockylinux:9 /morio/scripts/docker-build-moriod-rpm-steps.sh
