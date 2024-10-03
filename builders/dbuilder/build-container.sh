#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Set this once
CONTAINER=dbuilder

# Release to tag this with
# Either `latest` for production or `next` for a pre-release
if [[ "$MORIO_VERSION_TAG" == *-* ]]; then
  MORIO_RELEASE="testing"
else
  MORIO_RELEASE="latest"
fi

docker build \
  --tag itsmorio/$CONTAINER:$MORIO_RELEASE \
  --tag itsmorio/$CONTAINER:$MORIO_VERSION_TAG \
  $MORIO_GIT_ROOT/builders/dbuilder

