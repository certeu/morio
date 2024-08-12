#!/bin/bash
#
# This script will build the .deb package for moriod
# It is created for a CI environment, but should also run fine
# on a system that supports .deb (a Debian-based distribution)
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
npm run -s get moriod-version-env > $SRC/etc/morio/moriod/version.env

# Write out the vars EnvironmentFile for systemd
npm run -s get moriod-moriod-env > $SRC/etc/morio/moriod/moriod.env

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


if [ $? -eq 0 ]
then
  echo "Successfully built moriod .deb package"
else
  echo "Failed to build the moriod .deb pacakge"
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
    https://packagecloud.io/api/v1/repos/morio/deb/packages.json)

  if [ "201" = ${RESPONSE: -3} ]
  then
    echo "Package $NAME was published on packagecloud.io/morio/deb"
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

