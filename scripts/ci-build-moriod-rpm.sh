#!/bin/bash
#
# This script will build the .rpm package for moriod
# It is created for a CI environment, but should also run fine
# on a system that supports .rpm (a RedHat-based distribution)
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
RPMS=~/rpmbuild/RPMS/x86_64/

# Get the Morio version
VERSION=`npm run -s get version`

# Create folders to write files in
mkdir -p $SRC/etc/morio/moriod

# Write out the version file
npm run -s get version > $SRC/etc/morio/moriod/version

# Write out the .rpm spec file
npm run -s get moriod-rpm-spec > $SRC/build.spec

# Write out the version EnvironmentFile for systemd
npm run -s get moriod-deb-version-env > $SRC/etc/morio/moriod/version.env

# Write out the vars EnvironmentFile for systemd
npm run -s get moriod-deb-moriod-env > $SRC/etc/morio/moriod/moriod.env

# Build the package
cd $REPO/build-context
rpmdev-setuptree
rpmbuild -bb --quiet $SRC/build.spec --define "_sourcedir $WD/$SRC/"

if [ $? -eq 0 ]
then
  echo "Successfully built moriod .rpm package"
else
  echo "Failed to build the moriod .rpm pacakge"
  exit 1
fi
ls $RPMS

if [ -z "$1" ];
then
  echo "Not publishing the newly built package."
  exit 0
elif [ "publish" == $1 ]
then

  # We'll handle publishing once it builds
  exit 1
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
  curl \
    -u $PACKAGECLOUD_TOKEN:  \
    -F "package[distro_version_id]=35" \
    -F "package[package_file]=@$DIST/$NAME" \
    -X POST \
    https://packagecloud.io/api/v1/repos/morio/deb/packages.json

  if [ $? -eq 0 ]
  then
    echo "Successfully published package: $NAME"
  else
    echo "Failed to publish package: $NAME. HTTP status was $STATUS."
    exit 1
  fi
fi

echo "All done"
exit 0

