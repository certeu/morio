#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Set this once
CONTAINER=dbuilder

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

# Do not build clients in dev
if [ $RELEASE_CHANNEL != "dev" ]; then
  # Figure out whether or not we need to prebuild the clients
  cd $MORIO_GIT_ROOT/clients
  NEEDS_CLIENT_BUILD=0
  for BIN in morio-linux-amd64 morio-linux-arm64 morio-macos-amd64 morio-macos-arm64 morio-windows-amd64; do
    EXISTS=$(ls -1 $BIN | wc -l)
    if [ $EXISTS == "1" ]; then
      echo "Found client binary $BIN"
    else
      echo "No client binary $BIN, will build clients first"
      NEEDS_CLIENT_BUILD=1
    fi
  done
  cd -

  # Prebuild clients if needed
  if [ $NEEDS_CLIENT_BUILD != "0" ]; then
    cd $MORIO_GIT_ROOT/clients
    echo "Building clients"
    npm run build:clients
    cd -
    echo "Symlinking client binaries"
    mkdir -p $MORIO_GIT_ROOT/builders/dbuilder/clients
    cd $MORIO_GIT_ROOT/builders/dbuilder/clients
    ln -s ../../../clients/morio-* .
    cd -
  else
    echo "All client binaries are available"
  fi
fi

echo "Building dbuilder container"
cd $MORIO_GIT_ROOT/builders/dbuilder
tar -ch . | docker build \
  --tag $NAMESPACE/$CONTAINER:$RELEASE_CHANNEL_TAG \
  --tag $NAMESPACE/$CONTAINER:$MORIO_VERSION_TAG$TAG_SUFFIX \
  -

cd -

