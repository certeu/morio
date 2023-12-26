#!/bin/bash
#
# Check that an environment was specified
if [ -z "$2" ];
then
  echo ""
  echo "No target environment specified, will default to development."
  echo "Running container for Morio development environment."
  echo ""
  TARGET="dev"
  SUFFIX="-dev"
else
  if [ "prod" == $2 ]
  then
    echo ""
    echo "Running container for Morio production environment."
    echo ""
    TARGET="prod"
    SUFFIX=""
  else
    echo ""
    echo "Running container for Morio development environment."
    echo ""
    TARGET="dev"
    SUFFIX="-dev"
  fi
fi

# Check that a name was passed of which container to run
if [ -z "$1" ];
then
  echo "Please specify which container to run as a parameter to this script. Eg:"
  echo "run-container.sh api"
  exit 0
else
  # Container to run
  CONTAINER="$1$SUFFIX"

  # Figure out the repository root
  REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

  # Grab the Morio version from package.json
  VERSION=`sed 's/version/VERSION/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

  # Now run the container
fi
