#!/bin/bash
#
# Check that a name was passed of which container to build
if [ -z "$1" ];
then
  echo "Please specify which container to build as a parameter to this script. Eg:"
  echo "build-container.sh api"
  exit 0
else
  # Container to build
  CONTAINER=$1

  # Figure out the repository root
  REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

  # Grab the Morio version from package.json
  VERSION=`sed 's/version/VERSION/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

  # Now build the container
  cd $REPO/$CONTAINER
  tar -ch . | docker build \
    --tag morio/$CONTAINER:latest \
    --tag morio/$CONTAINER:$VERSION \
    -
fi



