#!/bin/bash
#
# This entrypoint script will build a Debian package.
#

#
# Build the Debian package
#
build_client_package() {
  local ARCH="$1"
  # Building the package is relatively simple
  # (once you know how to do it)
  cd /morio
  mkdir -p pkg/DEBIAN
  for FILE in control postinst; do
    if [ -f $SRC/$FILE ]
      then
      echo "Copying $SRC/$FILE"
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
  mkdir -p pkg/usr/sbin/
  cp $BIN/morio-linux-$ARCH pkg/usr/sbin/morio

  # Build the package
  dpkg-deb --build pkg $DIST
}

build_repo_package() {
  cd /morio
  mkdir -p pkg/DEBIAN
  for FILE in control postinst; do
    if [ -f $SRC/$FILE ]
      then
      echo "Copying $SRC/$FILE"
      cp $SRC/$FILE pkg/DEBIAN/
    fi
  done

  for DIRPATH in $SRC/*/; do
    DIR=$(basename "$DIRPATH")
    echo "Copying $DIR"
    cp -R $SRC/$DIR pkg/
  done
  # Build the package
  dpkg-deb --build pkg $DIST
}

#
# Update the APT repository
#
update_apt_repo() {
  #  Container is ephemeral, so always import private key for signing
  if [ $BUILD_JOB == "client" ]; then
    gpg --import /etc/dbuilder/priv.key
  else
    gpg --import /etc/drbuilder/priv.key
  fi

  # Does repo morio exist?
  aptly repo show morio
  REPO_EXISTS=$?
  if [ $REPO_EXISTS != "0" ]; then
    # Need to create the repository
    echo "Creating APT repository"
    aptly repo create -distribution=bookworm -component=main morio
  fi

  # Add packages
  aptly repo add morio $DIST

  if [ $REPO_EXISTS != "0" ]; then
    echo "Publishing repository"
    aptly publish repo -batch -component="main" -distribution="bookworm" -label="Morio Client" -architectures="amd64,arm64" morio .
  else
    echo "Updating published repository"
    aptly publish update bookworm .
  fi

  if [ $BUILD_JOB == "repo" ]; then
    # Sym-link latest version of packages for easy access from install script
    mkdir -p /repo/public/latest
    cp /repo/public/pool/main/m/morio-repo/$(ls -1t  /repo/public/pool/main/m/morio-repo/ | head -n 1) /repo/public/latest/morio-repo.deb
  fi
}

#
# Figure out what to build
#
BUILD_JOB="$1"
echo "Build job is $BUILD_JOB"

#
# Always import the public key
#

if [ $BUILD_JOB == "client" ]; then
  gpg --import /etc/dbuilder/pub.key
  SRC=/morio/client/src
  DIST=/morio/client/dist
  BIN=/morio-clients
  echo "Building client package for Debian on amd64"
  build_client_package amd64
  echo "Building client package for Debian on arm64"
  build_client_package arm64
  echo "Updating repository"
  update_apt_repo
elif [ $BUILD_JOB == "repo" ]; then
  gpg --import /etc/drbuilder/pub.key
  #
  # We need to export the public key and add it to the build
  # as it needs to be in this binary GPG format for APT to be happy
  #
  #mkdir -p /morio/repo/src/usr/share/keyrings
  #gpg --export > /morio/repo/src/etc/apt/usr/share/keyrings/morio-collector.gpg
  echo "Building repo package for Debian"
  SRC=/morio/repo/src
  DIST=/morio/repo/dist
  build_repo_package
  echo "Updating repository"
  update_apt_repo
else
  echo "Unknown build job, not running a build. Please specify 'client' or 'repo'"
fi

