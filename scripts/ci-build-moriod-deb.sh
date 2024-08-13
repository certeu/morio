#!/bin/bash
#
# This script will build the .deb package for moriod
# It is created for a CI environment, but should also run fine
# on a system that supports .deb (a Debian-based distribution)
#

# Sounce config variables
source config/cli.sh

#
# Create a folder to hold the build context
#
rm -rf $MORIO_GIT_ROOT/build-context
mkdir -p $MORIO_GIT_ROOT/build-context/dist
cp -R $MORIO_GIT_ROOT/moriod $MORIO_GIT_ROOT/build-context/src
SRC=$MORIO_GIT_ROOT/build-context/src
DIST=$MORIO_GIT_ROOT/build-context/dist

# Write out the version file
echo $MORIO_VERSION > $SRC/etc/morio/moriod/version

# Write out the .deb control file
npm run -s get moriod-deb-control > $SRC/control

# Write out the version EnvironmentFile for systemd
npm run -s get moriod-version-env > $SRC/etc/morio/moriod/version.env

# Write out the vars EnvironmentFile for systemd
npm run -s get moriod-moriod-env > $SRC/etc/morio/moriod/moriod.env

# Build the package
cd $MORIO_GIT_ROOT/build-context
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


if [ $? -eq 0 ]
then
  echo "Successfully built the moriod .deb package"
else
  echo "Failed to build the moriod .deb package"
  exit 1
fi

if [ -z "$1" ];
then
  echo "Not publishing the newly built package."
  exit 0
elif [ "publish" == $1 ]
then

  #
  # Grab the name
  #
  NAME=`ls -1 $DIST`
  echo "Attempting to publish package: $DIST/$NAME"

  #
  # Note that 35 is the id that you can get from the packagecloud API:
  # https://packagecloud.io/docs/api#resource_distributions
  # Username is the API token, password is empty
  #
    #--write-out '%{http_code}' --silent --output /dev/null \
  RESPONSE=$(curl \
    -s -w "%{http_code}" \
    -u $PACKAGECLOUD_TOKEN:  \
    -F "package[distro_version_id]=35" \
    -F "package[package_file]=@$DIST/$NAME" \
    -X POST \
    https://packagecloud.io/api/v1/repos/morio/debian-12/packages.json)

  if [ "201" = ${RESPONSE: -3} ]
  then
    echo "Package $NAME was published on packagecloud.io/morio/debian-12"
    exit 0
  elif [ "422" = ${RESPONSE: -3} ]
  then
    echo "Package already exists in the repository."
    echo "This might be ok, but we will still fail this pipeline to prevent this from going unnoticed."
    exit 1
  else
    echo "Failed to publish package: $NAME. HTTP status was ${RESPONSE: -3}"
    echo "Response below:"
    echo $RESPONSE
    exit 1
  fi
fi

echo "All done"
exit 0

