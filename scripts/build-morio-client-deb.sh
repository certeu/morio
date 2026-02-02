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
rm build-context/usr/sbin/.gitkeep
# Also copy client binary
cp local/builds/morio-linux-amd64 build-context/usr/sbin

# Update version control file
sed -i "s/__MORIO_VERSION__/${MORIO_VERSION}/g" ./build-context/DEBIAN/control

# Build package for different architectures
for arch in amd64 arm64
do

  # Update architecture control file
  sed -i "s/__MORIO_ARCHITECTURE__/${arch}/g" ./build-context/DEBIAN/control

  # Copy the client binary in place
  if [ -f "./local/builds/morio-linux-${arch}" ]; then
    echo "Copying client binary for ${arch}"
    cp ./local/builds/morio-linux-${arch} ./build-context/usr/sbin/morio
    chmod +x ./build-context/usr/sbin/morio
  else
    echo "Cannot locate client binary for ${arch}. Please build clients first."
    exit 1
  fi

  # Build the package
  cd $MORIO_GIT_ROOT/build-context
  dpkg-deb --build . ../local/builds
  cd -

  if [ $? -eq 0 ]
  then
    echo "Successfully built the morio-client.deb package for $arch"
  else
    echo "Failed to build the morio-client.deb package for $arch"
    exit 1
  fi

  # Restore architecture placeholder
  sed -i "s/${arch}/__MORIO_ARCHITECTURE__/g" ./build-context/DEBIAN/control

done

cd $MORIO_GIT_ROOT
echo
echo
echo "local/builds now holds:"
ls -1 ./local/builds
cd -

