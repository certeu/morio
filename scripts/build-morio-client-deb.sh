#!/usr/bin/env bash
#
# This script will build the .deb package for morio (the client)
# It is created for a CI environment, but should also run fine
# on a system that supports .deb (a Debian-based distribution)
#

# Source config variables
source config/cli.sh

# Check channel/component/environment
if [[ "$1" == "stable" || "$1" == "canary" || "$1" == "testing" ]]; then
  CHANNEL=$1
  if [[ "$1" == "stable" ]]; then
    MORIO_CONTAINER_TAG="v$MORIO_VERSION"
  else
    MORIO_CONTAINER_TAG="v$MORIO_VERSION-$CHANNEL"
  fi
  echo "Building morio.deb package: $MORIO_FULL_VERSION (channel = $CHANNEL)"
else
  echo "Invalid distribution channel. Please specify one of: stable, canary, testing."
  exit 1
fi

# Create package structure
cd $MORIO_GIT_ROOT
sudo rm -rf build-context
mkdir build-context
cp -R pkgs/morio-client/linux/* build-context
cd -

# Update version in various files
cd build-context
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" ./DEBIAN/control
cd -

# Build the package
cd $MORIO_GIT_ROOT/build-context
dpkg-deb --build . ../local/builds
cd -

if [ $? -eq 0 ]
then
  echo "Successfully built the morio-client.deb package"
else
  echo "Failed to build the morio-client.deb package"
  exit 1
fi

cd $MORIO_GIT_ROOT
echo
echo
echo "local/builds now holds:"
ls -1 ./local/builds
cd -

