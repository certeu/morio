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
  NAMESPACE="devmorio"
else
  if [ "prod" == $2 ]
  then
    echo ""
    echo "Building container for Morio production environment."
    echo ""
    TARGET="prod"
    NAMESPACE="itsmorio"
  elif [ "test" == $2 ]
  then
    echo ""
    echo "Building container for Morio testing environment."
    echo ""
    TARGET="test"
    NAMESPACE="testmorio"
  else
    echo ""
    echo "Building container for Morio development environment."
    echo ""
    TARGET="dev"
    NAMESPACE="devmorio"
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
  CONTAINER="$1"

  # If building core, build the clients first
  if [[ "$CONTAINER" == "core" ]]; then
    npm run build:clients
  fi

  # Release to tag this with
  # Either `latest` for production or `next` for a pre-release
  if [[ "$MORIO_VERSION_TAG" == *-* ]]; then
    MORIO_RELEASE="testing"
  else
    MORIO_RELEASE="latest"
  fi

  # Now build the container
  cd $MORIO_GIT_ROOT/$1
  tar -ch . | docker build \
    --file Containerfile.$TARGET \
    --tag $NAMESPACE/$CONTAINER:$MORIO_RELEASE \
    --tag $NAMESPACE/$CONTAINER:$MORIO_VERSION_TAG \
    -
fi

