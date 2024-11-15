#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Set this once
CONTAINER=dbuilder

# Release to tag this with
# Either `latest` for production or `next` for a pre-release
if [[ "$MORIO_VERSION_TAG" == *-* ]]; then
  MORIO_RELEASE="testing"
else
  MORIO_RELEASE="latest"
fi


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
cd

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

echo "Building dbuilder container"
cd $MORIO_GIT_ROOT/builders/dbuilder
tar -ch . | docker build \
  --tag itsmorio/$CONTAINER:$MORIO_RELEASE \
  --tag itsmorio/$CONTAINER:$MORIO_VERSION_TAG \
  -

cd -

