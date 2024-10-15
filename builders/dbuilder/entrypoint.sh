#!/bin/bash

SRC=/morio/src
DIST=/morio/dist
REPO=/repo

# Building the package is relatively simple
# (one you know how to do it)
cd /morio
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

#  Container is ephemeral, so always import keys for signing
gpg --import /etc/dbuilder/pub.key
gpg --import /etc/dbuilder/priv.key

# Generating/Updating the APT repository is a bit more work
# For one thing, we need to figure out whether this is the
# first time this runs in which case we should set up the
# repo, or if we should merely update it.
if [ -d "/repo/public/pool" ]; then
  echo "Updating existing APT repository with new package"
  aptly repo add morio $DIST
  aptly publish update bookworm
else
  echo "Creating APT repository"
  aptly repo create --distribution=bookworm -component=main morio 2>/dev/null
  aptly repo add morio $DIST
  aptly publish repo morio
fi
