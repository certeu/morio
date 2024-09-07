#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh
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

  # Now build the container
  cd $MORIO_GIT_ROOT/$1
  tar -ch . | docker build \
    --file Containerfile.$TARGET \
    --tag morio/$CONTAINER:latest \
    --tag morio/$CONTAINER:$MORIO_VERSION \
    -
fi

