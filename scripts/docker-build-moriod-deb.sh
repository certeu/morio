#!/bin/bash
#
# This script will build the .deb package for moriod inside a debian:bookworm container
# This allows you to build the .deb package on a non-deb Linux distro.
#

#
# Figure out the repository root
#
REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

#
# Run CI script inside the debian container
#
docker run --rm --name=moriod-deb-builder -v $REPO:/morio debian:bookworm /morio/scripts/docker-build-moriod-deb-steps.sh
