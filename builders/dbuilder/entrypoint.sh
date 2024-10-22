#!/bin/bash
#
# This entrypoint script will build a Debian package.
#

#
# Build the Debian package
#
build_package() {
  local ARCH="$1"
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
  # fix architecture in control file
  sed -i "s/__MORIO_CLIENT_ARCHITECTURE__/$ARCH/" pkg/DEBIAN/control
  for DIRPATH in $SRC/*/; do
    DIR=$(basename "$DIRPATH")
    echo "Copying $DIR"
    cp -R $SRC/$DIR pkg/
  done
  # Copy the binary for this architecture
  mkdir -p pkg/DEBIAN/usr/sbin/
  cp $BIN/morio-linux-$ARCH pkg/DEBIAN/usr/sbin/morio
  dpkg-deb --build pkg $DIST
}

#
# Update the APT repository
#
update_apt_repo() {
  #  Container is ephemeral, so always import private key for signing
  gpg --import /etc/dbuilder/priv.key

  # Generating/Updating the APT repository is a bit more work
  # For one thing, we need to figure out whether this is the
  # first time this runs in which case we should set up the
  # repo, or if we should merely update it.
  if [ -d "/repo/public/pool/main/m" ]; then
    echo "Updating existing APT repository with new package"
    aptly repo add morio $DIST
    aptly publish -architectures="amd64,arm64" update bookworm
  else
    echo "Creating APT repository"
    aptly repo create -distribution=bookworm -component=main morio 2>/dev/null
    aptly repo add morio $DIST
    aptly publish -architectures="amd64,arm64" repo morio
  fi

  # Sym-link latest version of packages for easy access from install script
  mkdir -p /repo/public/latest
  cp /repo/public/pool/main/m/morio-repo/$(ls -1t  /repo/public/pool/main/m/morio-repo/ | head -n 1) /repo/public/latest/morio-repo.deb
}

#
# Figure out what to build
#
BUILD_JOB=$(cat /etc/dbuilder/DBUILDER_JOB 2>/dev/null || echo "unknown")

#
# Always import the public key
#
gpg --import /etc/dbuilder/pub.key

if [ $BUILD_JOB == "client" ]; then
  SRC=/morio/client/src
  DIST=/morio/client/dist
  BIN=/morio/client/bin
  echo "Building client package for Debian on amd64"
  build_package amd64
  echo "Building client package for Debian on arm64"
  build_package arm64
  echo "Updating repository"
  update_apt_repo
elif [ $BUILD_JOB == "repo" ]; then
  #
  # We need to export the public key and add it to the build
  # as it needs to be in this binary GPG format for APT to be happy
  #
  #mkdir -p /morio/repo/src/usr/share/keyrings
  #gpg --export > /morio/repo/src/etc/apt/usr/share/keyrings/morio-collector.gpg
  echo "Building client repo package for Debian"
  SRC=/morio/repo/src
  DIST=/morio/repo/dist
  build_package
  echo "Updating repository"
  update_apt_repo
else
  echo "Unknown build job, running build from /morio/src folder"
  SRC=/morio/src
  DIST=/morio/dist
  build_package
fi

