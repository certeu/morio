#!/bin/bash
#
# This script will build the .rpm package for moriod inside a rockylinux:9 container
# This allows you to build the .rpm package on a non-rpm Linux distro.
#

#
# Figure out the repository root
#
REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

#
# Run CI script inside the rockylinux container
#
docker run --rm --name=moriod-rpm-builder -v $REPO:/morio rockylinux:9 /morio/scripts/docker-build-moriod-rpm-steps.sh
