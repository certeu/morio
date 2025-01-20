#!/usr/bin/env bash
# Source config variables
source config/cli.sh
#
# Check that an environment was specified
if [ -z "$1" ];
then
  echo ""
  echo "No target environment specified. Will default to testing."
  echo "Building container for Morio's testing release channel."
  echo ""
  RELEASE_CHANNEL="testing"
else
  if [ "stable" == $1 ]
  then
    echo ""
    echo "Building container images for Morio's stable release channel."
    echo ""
    RELEASE_CHANNEL="stable"
  elif [ "canary" == $1 ]
  then
    echo ""
    echo "Building container images for Morio's canary release channel."
    echo ""
    RELEASE_CHANNEL="canary"
  elif [ "dev" == $1 ]
  then
    echo ""
    echo "Building container images for local development."
    echo ""
    RELEASE_CHANNEL="dev"
  else
    echo ""
    echo "Building container for Morio's testing release channel."
    echo ""
    RELEASE_CHANNEL="testing"
  fi
fi

# Run all build commands
to_build=("api" "core" "ui" "dbuilder" "rbuilder" "tap")
for item in "${to_build[@]}"; do
  npm run build:$item $RELEASE_CHANNEL
done
