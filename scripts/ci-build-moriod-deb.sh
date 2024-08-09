#!/bin/bash
#
# This script will build the .deb package for moriod
# It is created for a CI environment, but should also run fine
# on a system that supports .deb (a Debuan-based distribution)
#

#
# Figure out the repository root
#
REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

#
# Create a folder to hold the build context
#
rm -rf $REPO/build-context
mkdir -p $REPO/build-context/dist
cp -R $REPO/moriod $REPO/build-context/src
SRC=$REPO/build-context/src
DIST=$REPO/build-context/dist

# Get the Morio version
VERSION=`npm run -s get version`

# Write out the version file
npm run -s get version > $SRC/etc/morio/moriod/version

# Write out the .deb control file
npm run -s get moriod-deb-control > $SRC/control

# Write out the version EnvironmentFile for systemd
npm run -s get moriod-deb-version-env > $SRC/etc/morio/moriod/version.env

# Write out the vars EnvironmentFile for systemd
npm run -s get moriod-deb-moriod-env > $SRC/etc/morio/moriod/moriod.env

# Build the package
cd $REPO/build-context
mkdir -p pkg/DEBIAN
for FILE in control postinst; do
  if [ -f $SRC/$FILE ]
    then
    cp $SRC/$FILE pkg/DEBIAN/
  fi
done
for DIR in etc usr var; do
  cp -R $SRC/$DIR pkg/
done
dpkg-deb --build pkg $DIST

