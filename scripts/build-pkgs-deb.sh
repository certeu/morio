#!/usr/bin/env bash
#
# This script will build all the .deb packages
# (morio-client, morio-repo, and moriod)

# Source config variables
source config/cli.sh

# Check channel/component/environment
if [[ "$1" == "stable" || "$1" == "canary" || "$1" == "testing" ]]; then
  CHANNEL=$1
  echo "Building .deb packages for $1 (channel = $CHANNEL)"
else
  echo "Invalid distribution channel. Please specify one of: stable, canary, testing."
  exit 1
fi

cd $MORIO_GIT_ROOT
./scripts/build-morio-client-deb.sh $CHANNEL
./scripts/build-morio-repo-deb.sh $CHANNEL
./scripts/build-moriod-deb.sh $CHANNEL
