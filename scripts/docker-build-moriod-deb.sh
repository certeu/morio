#!/bin/bash
#
# This script will build the .deb package for moriod inside a debian:bookworm container
# This allows you to build the .deb package on a non-deb Linux distro.
#

# Sounce config variables
source config/cli.sh

#
# Run CI script inside the debian container
#
docker run --rm --name=moriod-deb-builder -v $MORIO_GIT_ROOT:/morio debian:bookworm /morio/scripts/docker-build-moriod-deb-steps.sh
