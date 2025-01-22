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
    CONTAINER_TAG_1="latest"
    CONTAINER_TAG_2="$MORIO_VERSION_TAG"
  elif [ "canary" == $1 ]
  then
    echo ""
    echo "Building container images for Morio's canary release channel."
    echo ""
    RELEASE_CHANNEL="canary"
    CONTAINER_TAG_1="canary"
    CONTAINER_TAG_2="$MORIO_VERSION_TAG-canary"
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
    CONTAINER_TAG_1="testing"
    CONTAINER_TAG_2="$MORIO_VERSION_TAG-testing"
  fi
fi

# Run all build commands
to_build=("api" "core" "ui" "dbuilder" "rbuilder" "tap")
for item in "${to_build[@]}"; do
  npm run build:$item $RELEASE_CHANNEL
done

# Give instructions on how to publish
# Unless it's the dev build
if [ -n "$CONTAINER_TAG_1" ]; then
  echo "All container images are built"
  echo "To publish them, use these commands:"
  echo
  for item in "${to_build[@]}"; do
    echo "docker push itsmorio/$item:$CONTAINER_TAG_1"
    echo "docker push itsmorio/$item:$CONTAINER_TAG_2"
  done
  echo
fi


