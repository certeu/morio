#!/bin/bash
#
# This script will build the .rpm package for moriod
# It is created for a CI environment, but should also run fine
# on a system that supports .rpm (a RedHat-based distribution)
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
RPMS=~/rpmbuild/RPMS/x86_64/

# Create folders to write files in
mkdir -p $SRC/etc/morio/moriod

# Write out the version file
echo $MORIO_VERSION > $SRC/etc/morio/moriod/version

# Write out the .rpm spec file
npm run -s get moriod-rpm-spec > $SRC/build.spec

# Write out the version EnvironmentFile for systemd
npm run -s get moriod-version-env > $SRC/etc/morio/moriod/version.env

# Write out the vars EnvironmentFile for systemd
npm run -s get moriod-moriod-env > $SRC/etc/morio/moriod/moriod.env

# Build the package
cd $MORIO_GIT_ROOT/build-context
rpmdev-setuptree
rpmbuild -bb --quiet $SRC/build.spec --define "_sourcedir $WD/$SRC/"

if [ $? -eq 0 ]
then
  echo "Successfully built the moriod .rpm package"
else
  echo "Failed to build the moriod .rpm package"
  exit 1
fi
ls $RPMS

if [ -z "$1" ];
then
  echo "Not publishing the newly built package."
  exit 0
elif [ "publish" == $1 ]
then
  #
  # Grab the name
  #
  NAME=`ls -1 $RPMS`
  echo "Attempting to publish package: $RPMS/$NAME"

  #
  # Note that 35 is the id that you can get from the packagecloud API:
  # https://packagecloud.io/docs/api#resource_distributions
  # Username is the API token, password is empty
  #
    #--write-out '%{http_code}' --silent --output /dev/null \
  RESPONSE=$(curl \
    -s -w "%{http_code}" \
    -u $PACKAGECLOUD_TOKEN:  \
    -F "package[distro_version_id]=227" \
    -F "package[package_file]=@$RPMS/$NAME" \
    -X POST \
    https://packagecloud.io/api/v1/repos/morio/rpm/packages.json)

  if [ "201" = ${RESPONSE: -3} ]
  then
    echo "Package $NAME was published on packagecloud.io/morio/rpm"
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

