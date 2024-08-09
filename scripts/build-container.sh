#!/bin/bash
#
# Check that an environment was specified
if [ -z "$2" ];
then
  echo ""
  echo "No target environment specified, will default to development."
  echo "Building container for Morio development environment."
  echo ""
  TARGET="dev"
  SUFFIX="-dev"
else
  if [ "prod" == $2 ]
  then
    echo ""
    echo "Building container for Morio production environment."
    echo ""
    TARGET="prod"
    SUFFIX=""
  elif [ "test" == $2 ]
  then
    echo ""
    echo "Building container for Morio testing environment."
    echo ""
    TARGET="test"
    SUFFIX="-test"
  else
    echo ""
    echo "Building container for Morio development environment."
    echo ""
    TARGET="dev"
    SUFFIX="-dev"
  fi
fi

# Check that a name was passed of which container to build
if [ -z "$1" ];
then
  echo "Please specify which container to build as a parameter to this script. Eg:"
  echo "build-container.sh api"
  exit 0
else
  # Container to build
  CONTAINER="$1$SUFFIX"

  # Figure out the repository root
  REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

  # Grab the Morio version from package.json
  VERSION=`sed 's/\"version\"/\"VERSION\"/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

  # Now build the container
  cd $REPO/$1
  tar -ch . | docker build \
    --file Containerfile.$TARGET \
    --tag morio/$CONTAINER:latest \
    --tag morio/$CONTAINER:$VERSION \
    -
fi

