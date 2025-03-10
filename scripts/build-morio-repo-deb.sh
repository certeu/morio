#!/usr/bin/env bash
#
# This script will build the .deb package
# to add the morio APT repository to a system.

# Source config variables
source config/cli.sh

# Check channel/component/environment
if [[ "$1" == "stable" || "$1" == "canary" || "$1" == "testing" ]]; then
  CHANNEL=$1
  echo "Building morio-repo.deb package for $1 (channel = $CHANNEL)"
else
  echo "Invalid distribution channel. Please specify one of: stable, canary, testing."
  exit 1
fi

# Create package structure
cd $MORIO_GIT_ROOT
sudo rm -rf build-context
mkdir -p build-context/DEBIAN
cp -R pkgs/morio-repo/deb/* build-context/

# Update version/channel in various files
cd build-context
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" DEBIAN/control
sed -i "s/__MORIO_CHANNEL__/${CHANNEL}/g" etc/apt/sources.list.d/morio.list
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
