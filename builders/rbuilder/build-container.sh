#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Set this once
CONTAINER=rbuilder

# Figure out the release channel
if [ "stable" == $1 ]
then
  echo ""
  echo "Building container in channel: stable"
  echo ""
  RELEASE_CHANNEL="stable"
  RELEASE_CHANNEL_TAG="latest"
  NAMESPACE="itsmorio"
  TAG_SUFFIX=""
elif [ "canary" == $1 ]
then
  echo ""
  echo "Building container in channel: canary"
  echo ""
  RELEASE_CHANNEL="canary"
  RELEASE_CHANNEL_TAG="canary"
  NAMESPACE="itsmorio"
  TAG_SUFFIX="-canary"
elif [ "testing" == $1 ]
then
  echo ""
  echo "Building container in channel:  testing"
  echo ""
  RELEASE_CHANNEL="testing"
  RELEASE_CHANNEL_TAG="testing"
  NAMESPACE="itsmorio"
  TAG_SUFFIX="-$(git rev-parse HEAD)"
else
  echo ""
  echo "Building container for Morio development environment"
  echo ""
  RELEASE_CHANNEL="dev"
  RELEASE_CHANNEL_TAG="dev"
  NAMESPACE="itsmorio"
  TAG_SUFFIX="-dev"
fi

echo "Building rbuilder container"
cd $MORIO_GIT_ROOT/builders/rbuilder
tar -ch . | docker build \
  --tag $NAMESPACE/$CONTAINER:$RELEASE_CHANNEL_TAG \
  --tag $NAMESPACE/$CONTAINER:$MORIO_VERSION_TAG$TAG_SUFFIX \
  -

cd -
