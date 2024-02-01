#!/bin/bash

# Set this once
CONTAINER=dbuilder

# Figure out the repository root
REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd ../.. && pwd )"

# Grab the Morio version from package.json
VERSION=`sed 's/version/VERSION/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

docker build \
  --tag morio/$CONTAINER:latest \
  --tag morio/$CONTAINER:$VERSION \
  $REPO/builders/dbuilder

