#!/usr/bin/env bash
#
# This script will build the .deb package for moriod
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
  echo "Building moriod.deb package: $MORIO_FULL_VERSION (channel = $CHANNEL)"
else
  echo "Invalid distribution channel. Please specify one of: stable, canary, testing."
  exit 1
fi

# Create package structure
cd $MORIO_GIT_ROOT
sudo rm -rf build-context
mkdir build-context
cp -R moriod/* build-context
cd -

#SRC=$MORIO_GIT_ROOT/build-context/src
#DIST=$MORIO_GIT_ROOT/build-context/dist

# Update version in various files
cd build-context
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" ./DEBIAN/postinst
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" ./DEBIAN/control
sed -i "s/__MORIO_CONTAINER_TAG__/${MORIO_CONTAINER_TAG}/g" ./DEBIAN/postinst
sed -i "s/__MORIO_RELEASE_CHANNEL__/${CHANNEL}/g" ./DEBIAN/postinst
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" ./etc/morio/moriod/version
sed -i "s/__MORIO_CONTAINER_TAG__/${MORIO_CONTAINER_TAG}/g" ./etc/morio/moriod/channel.env
sed -i "s/__MORIO_RELEASE_CHANNEL__/${CHANNEL}/g" ./etc/morio/moriod/channel.env
cd -

# Build the package
cd $MORIO_GIT_ROOT/build-context
dpkg-deb --build . ../local/builds
cd -

if [ $? -eq 0 ]
then
  echo "Successfully built the moriod.deb package"
else
  echo "Failed to build the moriod.deb package"
  exit 1
fi

cd $MORIO_GIT_ROOT
echo
echo
echo "local/builds now holds:"
ls -1 ./local/builds
cd -

