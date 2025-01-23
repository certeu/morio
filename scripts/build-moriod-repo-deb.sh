#!/usr/bin/env bash
#
# This script will build the .deb package to add the morio APT
# repository to a system.

# Source config variables
source config/cli.sh

# Check channel/component/environment
if [[ "$1" == "stable" || "$1" == "canary" || "$1" == "testing" ]]; then
  CHANNEL=$1
  echo "Building moriod-repo.deb package for $1 (channel = $CHANNEL)"
else
  echo "Invalid distribution channel. Please specify one of: stable, canary, testing."
  exit 1
fi

# Create package structure
cd $MORIO_GIT_ROOT
sudo rm -rf build-context
mkdir -p build-context/DEBIAN
cp -R moriod-repos/deb/* build-context/
mv build-context/control build-context/DEBIAN
mv build-context/postinst build-context/DEBIAN

# Keep only the correct apt source file
cd build-context/etc/apt/sources.list.d
mv moriod.list.$CHANNEL moriod.list
rm moriod.list.*
cd -

# Update control file
cd build-context/DEBIAN
sed -i "s/MORIO_VERSION/${MORIO_VERSION}/g" control
cd -

# Now build the package
docker run -it \
  -v ${MORIO_GIT_ROOT}/build-context:/morio/src \
  -v ${MORIO_GIT_ROOT}/data/data:/morio/dist \
  itsmorio/dbuilder /entrypoint.sh moriodrepo

# Move into a known location
mkdir -p local/builds
cp data/data/*.deb local/builds

echo
echo
echo "local/builds now holds:"
ls -1 local/builds
